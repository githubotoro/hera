import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '../drizzle/drizzle.service';
import { CdpService } from '../cdp/cdp.service';
import {
  GetUserInfoRequestBody,
  GetUserInfoResponseBody,
  SendAuthEmailRequestBody,
  SendAuthEmailResponseBody,
  VerifyAuthEmailRequestBody,
  VerifyAuthEmailResponseBody,
} from './user.dto';
import * as crypto from 'crypto';
import { Fightcade } from 'fightcade-api';
import { Logger } from '@nestjs/common';
import { ResendService } from './resend.service';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { AppConfig } from '../config/config';
import { USDC_MAP } from '../config/constants';
import { ERC20_ABI } from '../viem/abi/ERC20';
import { ContractCall } from '../viem/caller.viem.service';
import { CallerViemService } from '../viem/caller.viem.service';
import { SafeBigInt } from '../../utils/parsers';
import { TokenAmount } from '../../utils/formatters';
import { Address } from 'viem';

const CONFIG = AppConfig();

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cdpService: CdpService,
    private readonly jwtService: JwtService,
    private readonly resendService: ResendService,
    private readonly callerViemService: CallerViemService,
  ) {}

  async sendAuthEmail(
    body: SendAuthEmailRequestBody,
  ): Promise<SendAuthEmailResponseBody> {
    try {
      const fightCadeProfile = await Fightcade.GetUser(body.username);

      const userId = crypto
        .createHash('md5')
        .update(body.email.toLowerCase().trim())
        .digest('hex');

      const isEmailMatch = userId === fightCadeProfile.gravatar;

      if (!isEmailMatch) {
        throw new BadRequestException(
          'Email does not match the Fightcade profile. Please check your email and try again.',
        );
      }

      await this.resendService.sendVerificationEmail({
        userId,
        username: body.username,
        email: body.email,
      });

      return {
        status: true,
      };
    } catch (error) {
      throw new BadRequestException(
        'No Fightcade account found for this username. Please check your username and try again.',
      );
    }
  }

  async verifyAuthEmail(
    body: VerifyAuthEmailRequestBody,
  ): Promise<VerifyAuthEmailResponseBody> {
    const data = await this.resendService.verifyEmail({
      verificationCode: body.verificationCode.toLowerCase().trim(),
    });

    return {
      userId: data.userId,
      userToken: data.userToken,
    };
  }

  async getUserInfo(
    body: GetUserInfoRequestBody,
  ): Promise<GetUserInfoResponseBody> {
    const decoded = this.jwtService.verify(body.userToken);

    const user = await this.drizzleService.read.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    const contractCalls: ContractCall[] = [
      {
        id: `base`,
        chainId: 8453,
        address: USDC_MAP[8453].address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [user.smartAccountAddress],
      },
      {
        id: `base-sepolia`,
        chainId: 84532,
        address: USDC_MAP[84532].address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [user.smartAccountAddress],
      },
    ];

    const results =
      await this.callerViemService.processContractCalls(contractCalls);

    const baseBalanceRawAmount = SafeBigInt(results.get('base'));
    const baseSepoliaBalanceRawAmount = SafeBigInt(results.get('base-sepolia'));

    const baseBalanceTokenAmount = TokenAmount(
      baseBalanceRawAmount,
      USDC_MAP[8453].decimals,
    );
    const baseSepoliaBalanceTokenAmount = TokenAmount(
      baseSepoliaBalanceRawAmount,
      USDC_MAP[84532].decimals,
    );

    const baseBalance = {
      ...USDC_MAP[8453],
      rawAmount: baseBalanceRawAmount.toString(),
      tokenAmount: baseBalanceTokenAmount,
    };

    const baseSepoliaBalance = {
      ...USDC_MAP[84532],
      rawAmount: baseSepoliaBalanceRawAmount.toString(),
      tokenAmount: baseSepoliaBalanceTokenAmount,
    };

    const balance = {
      '8453': baseBalance,
      '84532': baseSepoliaBalance,
    };

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      eoaAddress: user.eoaAddress,
      smartAccountAddress: user.smartAccountAddress,
      balance,
    };
  }
}
