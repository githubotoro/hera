import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { users, verificationEmails } from '../drizzle/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { Resend } from 'resend';
import { AppConfig } from '../config/config';
import * as crypto from 'crypto';
import { CdpService } from '../cdp/cdp.service';
import { JwtService } from '@nestjs/jwt';
import { USDC_MAP } from '../config/constants';
import { ERC20_ABI } from '../viem/abi/ERC20';
import { ethers } from 'ethers';

const CONFIG = AppConfig();

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cdpService: CdpService,
    private readonly jwtService: JwtService,
  ) {}

  async sendVerificationEmail({
    userId,
    username,
    email,
  }: {
    userId: string;
    username: string;
    email: string;
  }) {
    const emailsSentInLast24Hours =
      await this.drizzleService.read.query.verificationEmails.findMany({
        where: and(
          eq(verificationEmails.email, email),
          gt(
            verificationEmails.createdAt,
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ),
        ),
      });

    if (emailsSentInLast24Hours.length >= 10) {
      throw new BadRequestException(
        'You have reached the maximum number of verification emails sent in the last 24 hours. Please try again later.',
      );
    }

    const currentTimestamp = new Date();

    // this should be 6 characters, alphanumeric only
    const verificationCode = crypto
      .randomBytes(3)
      .toString('hex')
      .toLowerCase();

    // check if the verification code is already used
    const existingVerificationEmail =
      await this.drizzleService.read.query.verificationEmails.findFirst({
        where: and(
          eq(verificationEmails.verificationCode, verificationCode),
          gt(
            verificationEmails.expiresAt,
            new Date(currentTimestamp.getTime() + 1000 * 60 * 5).toISOString(),
          ),
        ),
      });

    if (existingVerificationEmail) {
      throw new BadRequestException('Verification code already used');
    }

    const data: typeof verificationEmails.$inferInsert = {
      userId,
      email,
      username,
      verificationCode,
      expiresAt: new Date(
        currentTimestamp.getTime() + 1000 * 60 * 10,
      ).toISOString(), // 10 minutes
      createdAt: currentTimestamp.toISOString(),
      usedAt: null,
      revokedAt: null,
    };

    await this.drizzleService.write.insert(verificationEmails).values(data);

    const resend = new Resend(CONFIG.RESEND_API_KEY);

    try {
      const response = await resend.emails.send({
        from: 'Hera <hera@yupuday.com>',
        to: email,
        subject: `Hera Sign In Code: ${verificationCode.toUpperCase()}`,
        html: `<p>Your Hera sign in code is <strong>${verificationCode.toUpperCase()}</strong> <br/> <br/> <i> This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email. No further action is needed. </i> </p>`,
      });

      // this.logger.debug(response);

      // this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(error);
    }

    return {
      verificationCode,
    };
  }

  async verifyEmail({
    verificationCode,
  }: {
    verificationCode: string;
  }): Promise<{
    userId: string;
    username: string;
    email: string;
    userToken: string;
    eoaAddress: string;
    smartAccountAddress: string;
  }> {
    const currentTimestamp = new Date();

    const verificationEmail =
      await this.drizzleService.read.query.verificationEmails.findFirst({
        where: and(
          eq(verificationEmails.verificationCode, verificationCode),
          gt(
            verificationEmails.expiresAt,
            new Date(currentTimestamp.getTime()).toISOString(),
          ),
          isNull(verificationEmails.usedAt),
          isNull(verificationEmails.revokedAt),
        ),
      });

    if (!verificationEmail) {
      throw new NotFoundException(
        'This verification code is already used or expired. Please try signing in agains.',
      );
    }

    let eoaAddress = '';
    let smartAccountAddress = '';

    const existingUser = await this.drizzleService.read.query.users.findFirst({
      where: and(eq(users.id, verificationEmail.userId)),
    });

    if (existingUser) {
      eoaAddress = existingUser.eoaAddress;
      smartAccountAddress = existingUser.smartAccountAddress;
    }

    // If user doesn't exist, create new user
    // Mint them 100 USDC on Base Sepolia
    if (!existingUser) {
      const cdp = this.cdpService.cdp;

      const eoaAccount = await cdp.evm.getOrCreateAccount({
        name: verificationEmail.userId,
      });

      const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: verificationEmail.userId,
        owner: eoaAccount,
      });

      eoaAddress = eoaAccount.address.toLowerCase();

      smartAccountAddress = smartAccount.address.toLowerCase();

      const usdcInterface = new ethers.Interface(ERC20_ABI);

      const usdcMintCalldata = usdcInterface.encodeFunctionData('mint', [
        smartAccount.address,
        ethers.parseUnits('100', USDC_MAP['84532'].decimals).toString(),
      ]);

      // Fund the smart account on base sepolia with 100 USDC
      const userOperation = await cdp.evm.sendUserOperation({
        smartAccount: smartAccount,
        network: 'base-sepolia',
        // @ts-ignore
        calls: [
          {
            to: USDC_MAP['84532'].address as `0x${string}`,
            value: BigInt(0),
            data: usdcMintCalldata as `0x${string}`,
          },
        ],
      });

      // wait for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // this.logger.log(
      //   `Funded smart account ${smartAccountAddress} with 100 USDC`,
      // );

      const newUser: typeof users.$inferInsert = {
        id: verificationEmail.userId,
        email: verificationEmail.email,
        username: verificationEmail.username,
        eoaAddress,
        smartAccountAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.drizzleService.write.insert(users).values(newUser);
    }

    // Mark the email as used
    await this.drizzleService.write
      .update(verificationEmails)
      .set({
        usedAt: new Date().toISOString(),
      })
      .where(eq(verificationEmails.verificationCode, verificationCode));

    const userToken = this.jwtService.sign({
      userId: verificationEmail.userId,
    });

    return {
      userId: verificationEmail.userId,
      username: verificationEmail.username,
      email: verificationEmail.email,
      userToken,
      eoaAddress,
      smartAccountAddress,
    };
  }
}
