import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { sessionLogs, sessions, users } from '../drizzle/schema';
import {
  CreateSessionRequestBody,
  BetSessionRequestBody,
  GetSessionInfoRequestBody,
  JoinSessionRequestBody,
  GetHistoryRequestBody,
  GetSessionInfoResponseBody,
  BetSessionResponseBody,
  CreateSessionResponseBody,
  JoinSessionResponseBody,
  SettleSessionReplayRequestBody,
  SettleSessionReplayResponseBody,
  GetHistoryResponseBody,
  SettleSessionReplayByQuarkIdRequestBody,
} from './session.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { and, count, desc, eq, getTableColumns, gt, sql } from 'drizzle-orm';
import { TokenAmount } from '../../utils/formatters';
import { USDC_MAP } from '../config/constants';
import { SafeBigInt } from '../../utils/parsers';
import { Logger } from '@nestjs/common';
import { ERC20_ABI } from '../viem/abi/ERC20';
import { ContractCall } from '../viem/caller.viem.service';
import { CallerViemService } from '../viem/caller.viem.service';
import { BaseRequestBody } from '../drizzle/drizzle.dto';
import { GenericDrizzleService } from '../drizzle/generic.drizzle.service';
import { TokenInfo } from '../user/user.dto';
import { Address } from 'viem';
import { Fightcade } from 'fightcade-api';
import { CdpService } from '../cdp/cdp.service';
import { ethers } from 'ethers';

// Configure fetch to avoid caching issues
const fetchWithNoCache = async (url: string, options: RequestInit) => {
  const timestamp = Date.now();
  const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}`;

  return fetch(urlWithTimestamp, {
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'User-Agent': 'Hera-Backend/1.0',
    },
  });
};

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly jwtService: JwtService,
    private readonly callerViemService: CallerViemService,
    private readonly genericDrizzleService: GenericDrizzleService,
    private readonly cdpService: CdpService,
  ) {}

  async createSession(
    body: CreateSessionRequestBody,
  ): Promise<CreateSessionResponseBody> {
    if (body.network !== '8453' && body.network !== '84532') {
      throw new BadRequestException('Invalid network');
    }

    const userToken = this.jwtService.verify(body.userToken);

    const sessionCode = crypto.randomBytes(3).toString('hex').toLowerCase();

    const sessionCodeExists =
      await this.drizzleService.read.query.sessions.findFirst({
        where: and(
          eq(sessions.sessionCode, sessionCode),
          gt(sessions.expiresAt, new Date().toISOString()),
        ),
      });

    if (sessionCodeExists) {
      throw new BadRequestException(
        'Session creation failed. Please try again.',
      );
    }

    const data: typeof sessions.$inferInsert = {
      sessionCode,
      network: body.network,
      player1Id: userToken.userId,
      player1LastActiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
    };

    const [session] = await this.drizzleService.write
      .insert(sessions)
      .values(data)
      .returning();

    this.logger.log(`Created session with id: ${session.id}`);

    const sessionToken = this.jwtService.sign(
      {
        userId: userToken.userId,
        sessionId: session.id,
      },
      {
        expiresIn: '1h',
      },
    );

    return {
      sessionId: session.id,
      sessionCode,
      sessionToken,
    };
  }

  async joinSession(
    body: JoinSessionRequestBody,
  ): Promise<JoinSessionResponseBody> {
    const userToken = this.jwtService.verify(body.userToken);

    const sessionExists =
      await this.drizzleService.read.query.sessions.findFirst({
        where: and(
          eq(sessions.sessionCode, body.sessionCode),
          gt(sessions.expiresAt, new Date().toISOString()),
        ),
      });

    if (!sessionExists) {
      throw new BadRequestException('Session does not exist or expired');
    }

    if (sessionExists.player1Id === userToken.userId) {
      await this.drizzleService.write
        .update(sessions)
        .set({
          player1LastActiveAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionExists.id));
    } else if (
      !sessionExists.player2Id ||
      sessionExists.player2Id === userToken.userId
    ) {
      await this.drizzleService.write
        .update(sessions)
        .set({
          player2Id: userToken.userId,
          player2LastActiveAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionExists.id));
    } else {
      throw new BadRequestException(
        'This session was already joined by another user first. Please create a new session or join another session.',
      );
    }

    const expiresIn =
      new Date(sessionExists.expiresAt).getTime() - new Date().getTime();

    if (expiresIn < 0) {
      throw new BadRequestException('Session does not exist or expired');
    }

    const sessionToken = this.jwtService.sign(
      {
        userId: userToken.userId,
        sessionId: sessionExists.id,
      },
      {
        expiresIn,
      },
    );

    return {
      sessionId: sessionExists.id,
      sessionCode: sessionExists.sessionCode,
      sessionToken,
    };
  }

  async getSessionInfo(
    body: GetSessionInfoRequestBody,
  ): Promise<GetSessionInfoResponseBody> {
    const session = await this.drizzleService.read.query.sessions.findFirst({
      where: eq(sessions.id, body.sessionId),
      with: {
        user_player1Id: true,
        user_player2Id: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session does not exist or expired');
    }

    if (body.userToken) {
      try {
        const userToken = this.jwtService.verify(body.userToken);

        if (userToken.userId === session.player1Id) {
          await this.drizzleService.write
            .update(sessions)
            .set({
              player1LastActiveAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, session.id));
        } else if (userToken.userId === session.player2Id) {
          await this.drizzleService.write
            .update(sessions)
            .set({
              player2LastActiveAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, session.id));
        }
      } catch (error) {}
    }

    const player1RawAmountDataQuery = this.drizzleService.read
      .select({ totalAmount: sql<string>`sum(${sessionLogs.amount})` })
      .from(sessionLogs)
      .where(
        and(
          eq(sessionLogs.sessionId, body.sessionId),
          eq(sessionLogs.userId, session.player1Id),
        ),
      );

    const player2RawAmountDataQuery = this.drizzleService.read
      .select({ totalAmount: sql<string>`sum(${sessionLogs.amount})` })
      .from(sessionLogs)
      .where(
        and(
          eq(sessionLogs.sessionId, body.sessionId),
          eq(sessionLogs.userId, session.player2Id),
        ),
      );

    const [player1RawAmountData, player2RawAmountData] = await Promise.all([
      player1RawAmountDataQuery,
      player2RawAmountDataQuery,
    ]);

    const player1RawAmount = SafeBigInt(
      player1RawAmountData[0]?.totalAmount ?? '0',
    ).toString();

    const player2RawAmount = SafeBigInt(
      player2RawAmountData[0]?.totalAmount ?? '0',
    ).toString();

    const player1TokenAmount = TokenAmount(
      player1RawAmount,
      USDC_MAP[session.network].decimals,
    );

    const player2TokenAmount = TokenAmount(
      player2RawAmount,
      USDC_MAP[session.network].decimals,
    );

    const onlineCutoffTime = new Date(Date.now() - 1000 * 60 * 1); // 1 minute

    const balanceContractCalls: ContractCall[] = [
      {
        id: `balance-player1`,
        chainId: Number(session.network),
        address: USDC_MAP[session.network].address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [session.user_player1Id.smartAccountAddress],
      },
      ...(session.player2Id
        ? [
            {
              id: `balance-player2`,
              chainId: Number(session.network),
              address: USDC_MAP[session.network].address as Address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [session.user_player2Id.smartAccountAddress],
            },
          ]
        : []),
    ];

    const balanceResults =
      await this.callerViemService.processContractCalls(balanceContractCalls);

    const player1Balance = SafeBigInt(balanceResults.get('balance-player1'));
    const player2Balance = SafeBigInt(balanceResults.get('balance-player2'));

    let player1 = {
      id: session.player1Id,
      username: session.user_player1Id.username,
      tokenInfo: {
        ...USDC_MAP[session.network],
        rawAmount: player1RawAmount,
        tokenAmount: player1TokenAmount,

        balanceRawAmount: player1Balance.toString(),
        balanceTokenAmount: TokenAmount(
          player1Balance.toString(),
          USDC_MAP[session.network].decimals,
        ),
      },
      isOnline: new Date(session.player1LastActiveAt) >= onlineCutoffTime,
    };

    let player2 = undefined;

    if (session.player2Id) {
      player2 = {
        id: session.player2Id,
        username: session.user_player2Id.username,
        tokenInfo: {
          ...USDC_MAP[session.network],
          rawAmount: player2RawAmount,
          tokenAmount: player2TokenAmount,

          balanceRawAmount: player2Balance.toString(),
          balanceTokenAmount: TokenAmount(
            player2Balance.toString(),
            USDC_MAP[session.network].decimals,
          ),
        },
        isOnline: new Date(session.player2LastActiveAt) >= onlineCutoffTime,
      };
    }

    return {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      network: session.network,
      player1,
      player2,
      expiresAt: session.expiresAt,
    };
  }

  async betSession(
    body: BetSessionRequestBody,
  ): Promise<BetSessionResponseBody> {
    if (SafeBigInt(body.rawAmount) <= 0) {
      throw new BadRequestException('Bet amount must be greater than 0');
    }

    const sessionToken = this.jwtService.verify(body.sessionToken);

    const session = await this.drizzleService.read.query.sessions.findFirst({
      where: and(
        eq(sessions.id, sessionToken.sessionId),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
      with: {
        user_player1Id: true,
        user_player2Id: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session does not exist or expired');
    }

    if (
      session.player1Id !== sessionToken.userId &&
      (!session.player2Id || session.player2Id !== sessionToken.userId)
    ) {
      throw new BadRequestException('You are not a player of this session');
    }

    const smartAccountAddress =
      session.player1Id === sessionToken.userId
        ? session.user_player1Id.smartAccountAddress
        : session.player2Id === sessionToken.userId
          ? session.user_player2Id.smartAccountAddress
          : null;

    const network = session.network;

    const contractCalls: ContractCall[] = [
      {
        id: 'balance',
        chainId: Number(network),
        address: USDC_MAP[network].address as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [smartAccountAddress],
      },
    ];

    const results =
      await this.callerViemService.processContractCalls(contractCalls);

    const walletBalance = SafeBigInt(results.get('balance'));

    const currentBetRawAmount = await this.drizzleService.read
      .select({ totalAmount: sql<string>`sum(${sessionLogs.amount})` })
      .from(sessionLogs)
      .where(
        and(
          eq(sessionLogs.sessionId, sessionToken.sessionId),
          eq(sessionLogs.userId, sessionToken.userId),
        ),
      );

    const requiredBalance =
      SafeBigInt(body.rawAmount) +
      SafeBigInt(currentBetRawAmount[0]?.totalAmount ?? '0');

    if (walletBalance < requiredBalance) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const timestampId = Date.now();

    const data: typeof sessionLogs.$inferInsert = {
      id: `bet_${timestampId}`,
      timestampId: timestampId.toString(),
      sessionId: session.id,
      userId: sessionToken.userId,
      category: 'bet',
      amount: body.rawAmount,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.drizzleService.write.insert(sessionLogs).values(data);
    } catch (error) {
      this.logger.debug('Failed to bet', error);
      throw new InternalServerErrorException('Failed to bet');
    }

    return {
      success: true,
    };
  }

  async getHistory(
    body: GetHistoryRequestBody,
  ): Promise<GetHistoryResponseBody> {
    const userToken = this.jwtService.verify(body.userToken);

    const countQuery = this.drizzleService.read
      .select({
        count: count(),
      })
      .from(sessionLogs)
      .where(and(eq(sessionLogs.userId, userToken.userId)));

    const baseQuery = this.drizzleService.read
      .select()
      .from(sessionLogs)
      .where(and(eq(sessionLogs.userId, userToken.userId)))
      .orderBy(desc(sessionLogs.createdAt));

    const sessionLogsColumns = getTableColumns(sessionLogs);

    const refinedFilters = (body.filters ?? []).map((filter) => {
      return {
        ...filter,
        column: sessionLogsColumns[filter.id],
      };
    });

    const refinedSorting = (body.sorting ?? []).map((sorting) => {
      return {
        ...sorting,
        column: sessionLogsColumns[sorting.id],
      };
    });

    const refinedPage = {
      index: body.page?.index ?? 1,
      size: body.page?.size ?? 100,
    };

    const {
      data: _data,
      count: _count,
      page: _page,
    } = await this.genericDrizzleService.buildGenericQuery({
      baseQuery: baseQuery.$dynamic(),
      countQuery: countQuery.$dynamic(),
      filters: refinedFilters,
      sorting: refinedSorting,
      page: refinedPage,
    });

    const returnData = _data.map((log) => {
      return {
        ...log,
        rawAmount: log.amount,
        tokenAmount: TokenAmount(SafeBigInt(log.amount).toString(), 6),
      };
    });

    return {
      data: returnData,
    };

    // return {
    //   data: _data,
    //   count: _count,
    //   page: _page,
    // };
  }

  async settleSessionReplay(
    body: SettleSessionReplayRequestBody,
  ): Promise<SettleSessionReplayResponseBody> {
    // const userToken = this.jwtService.verify(body.userToken);

    const session = await this.drizzleService.read.query.sessions.findFirst({
      where: eq(sessions.id, body.sessionId),
      with: {
        user_player1Id: true,
        user_player2Id: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session does not exist or expired');
    }

    const userInfo = await this.drizzleService.read.query.users.findFirst({
      where: eq(users.id, body.userId),
    });

    if (!userInfo) {
      throw new BadRequestException('User does not exist');
    }

    this.logger.debug(
      'session.createdAt',
      new Date(session.createdAt).getTime(),
    );

    let objects: any[] = [
      {
        offset: 0,
      },
      {
        limit: 100,
      },
    ];

    let currentTimestamp = new Date().getTime();

    let currObject = objects[currentTimestamp % 2];

    // const userReplays = await Fightcade.GetUserReplays(
    //   userInfo.username,
    //   currObject,
    // );

    // let tryUserReplays1 = await Fightcade.GetUserReplays(userInfo.username, {
    //   limit: 100,
    // });

    let tryUserReplays1 = await fetchWithNoCache(
      `https://www.fightcade.com/api/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          req: 'searchquarks',
          username: userInfo.username,
          offset: 0,
        }),
      },
    ).then((res) => res.json().then((data) => data.results.results));

    this.logger.debug('tryUserReplays1[0]', tryUserReplays1[0].quarkid);
    this.logger.debug('tryUserReplays1[0].date', tryUserReplays1[0].date);
    this.logger.debug('Current timestamp', Date.now());

    // let tryUserReplays2 = await Fightcade.GetUserReplays(userInfo.username, {
    //   offset: 0,
    // });

    let tryUserReplays2 = await fetchWithNoCache(
      `https://www.fightcade.com/api/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          req: 'searchquarks',
          username: userInfo.username,
          limit: 50,
        }),
      },
    ).then((res) => res.json().then((data) => data.results.results));

    this.logger.debug('tryUserReplays2[0]', tryUserReplays2[0].quarkid);
    this.logger.debug('tryUserReplays2[0].date', tryUserReplays2[0].date);

    // let tryUserReplays3 = await Fightcade.GetUserReplays(userInfo.username, {
    //   limit: 100,
    //   offset: 0,
    // });

    // let tryUserReplays4 = await Fightcade.GetUserReplays(userInfo.username, {
    //   limit: 50,
    // });

    if (tryUserReplays1.length === 0 || tryUserReplays2.length === 0) {
      throw new BadRequestException('No replays found for user');
    }

    // Find the array with the replay that has the greatest date
    const getMaxDate = (replays: any[]) =>
      Math.max(...replays.map((r) => r.date));

    const maxDate1 = getMaxDate(tryUserReplays1);
    const maxDate2 = getMaxDate(tryUserReplays2);

    let userReplays;
    if (maxDate1 >= maxDate2) {
      userReplays = tryUserReplays1;
    } else {
      userReplays = tryUserReplays2;
    }

    // this.logger.debug('userReplays', userReplays);

    const replay = userReplays[0];
    const replayId = replay.quarkid;

    this.logger.debug('replayId', replayId);

    const isReplayIdAlreadySettled =
      await this.drizzleService.read.query.sessionLogs.findFirst({
        where: eq(sessionLogs.replayId, replayId),
      });

    if (isReplayIdAlreadySettled) {
      throw new BadRequestException('Replay has already been settled');
    }

    // const userReplayStartDate = new Date(replay.date);
    // const userReplayEndDate = new Date(
    //   Number(replay.date) + replay.duration * 1000,
    // );

    // this.logger.debug('userReplayStartDate', userReplayStartDate);
    // this.logger.debug('userReplayEndDate', userReplayEndDate);
    // this.logger.debug('session.createdAt', session.createdAt);
    // this.logger.debug('session.expiresAt', session.expiresAt);

    // if (
    //   userReplayStartDate >= new Date(session.createdAt) &&
    //   userReplayEndDate <= new Date(session.expiresAt)
    // ) {
    //   // valid replay
    // } else {
    //   throw new BadRequestException(
    //     'Only replays played in the session can be settled',
    //   );
    // }

    const allSessionLogs =
      await this.drizzleService.read.query.sessionLogs.findMany({
        where: and(eq(sessionLogs.sessionId, body.sessionId)),
        orderBy: desc(sessionLogs.createdAt),
      });

    // if (allSessionLogs.some((log) => log.replayId === replayId)) {
    //   throw new BadRequestException('Replay has already been settled');
    // }

    if (allSessionLogs.length === 0) {
      throw new BadRequestException('No bets have been made in this session');
    }

    if (
      allSessionLogs[0].category === 'won' ||
      allSessionLogs[0].category === 'lost'
    ) {
      throw new BadRequestException('Session has already been settled');
    }

    if (replay.players.length !== 2) {
      throw new BadRequestException('Replay is invalid');
    }

    if (!session.user_player2Id) {
      throw new BadRequestException(
        'Session was not joined by a second player',
      );
    }

    // this.logger.debug('replay.players[0].name', replay.players[0].name);
    // this.logger.debug('replay.players[1].name', replay.players[1].name);
    // this.logger.debug(
    //   'session.user_player1Id.username',
    //   session.user_player1Id.username,
    // );
    // this.logger.debug(
    //   'session.user_player2Id.username',
    //   session.user_player2Id.username,
    // );

    if (
      replay.players[0].name !== session.user_player1Id.username &&
      replay.players[1].name !== session.user_player1Id.username
    ) {
      throw new BadRequestException(
        'Session player does not match replay player 1',
      );
    } else if (
      replay.players[0].name !== session.user_player2Id.username &&
      replay.players[1].name !== session.user_player2Id.username
    ) {
      throw new BadRequestException(
        'Session player does not match replay player 2',
      );
    }

    let player1 = replay.players[0].name;
    let player2 = replay.players[1].name;

    let winnerPlayerUsername = '';
    let loserPlayerUsername = '';

    if (replay.players[0].score === replay.players[1].score) {
      throw new BadRequestException('Replay is a tie');
    }

    if (replay.players[0].score > replay.players[1].score) {
      winnerPlayerUsername = player1;
      loserPlayerUsername = player2;
    } else {
      winnerPlayerUsername = player2;
      loserPlayerUsername = player1;
    }

    let dbPlayer1Username = session.user_player1Id.username;
    let dbPlayer2Username = session.user_player2Id.username;

    let dbPlayer1BetAmount = allSessionLogs.reduce((acc, log) => {
      if (log.userId === session.user_player1Id.id) {
        return acc + SafeBigInt(log.amount);
      }
      return acc;
    }, SafeBigInt(0));

    let dbPlayer2BetAmount = allSessionLogs.reduce((acc, log) => {
      if (log.userId === session.user_player2Id.id) {
        return acc + SafeBigInt(log.amount);
      }
      return acc;
    }, SafeBigInt(0));

    if (winnerPlayerUsername === dbPlayer1Username) {
      if (dbPlayer2BetAmount === SafeBigInt(0)) {
        throw new BadRequestException('Player 2 did not bet');
      }
    } else {
      if (dbPlayer1BetAmount === SafeBigInt(0)) {
        throw new BadRequestException('Player 1 did not bet');
      }
    }

    let winnerUserId =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player1Id.id
        : session.user_player2Id.id;
    let loserUserId =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player2Id.id
        : session.user_player1Id.id;

    let winnerSmartAccountAddress =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player1Id.smartAccountAddress
        : session.user_player2Id.smartAccountAddress;

    let transferRawAmount =
      winnerPlayerUsername === dbPlayer1Username
        ? dbPlayer2BetAmount
        : dbPlayer1BetAmount;

    const cdp = this.cdpService.cdp;

    const eoaAccount = await cdp.evm.getOrCreateAccount({
      name: loserUserId,
    });

    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: loserUserId,
      owner: eoaAccount,
    });

    const usdcInterface = new ethers.Interface(ERC20_ABI);

    const usdcTransferCalldata = usdcInterface.encodeFunctionData('transfer', [
      winnerSmartAccountAddress,
      transferRawAmount,
    ]);

    let timestampId = Date.now();

    const newSettledSessionLogs: (typeof sessionLogs.$inferInsert)[] = [
      {
        id: `won_${timestampId}`,
        timestampId: timestampId.toString(),
        sessionId: session.id,
        userId: winnerUserId,
        category: 'won',
        amount: transferRawAmount.toString(),
        createdAt: new Date().toISOString(),
        isSettled: true,
        replayId: replayId,
      },
      {
        id: `lost_${timestampId}`,
        timestampId: timestampId.toString(),
        sessionId: session.id,
        userId: loserUserId,
        category: 'lost',
        amount: (-1n * transferRawAmount).toString(),
        createdAt: new Date().toISOString(),
        isSettled: true,
        replayId: replayId,
      },
    ];

    await this.drizzleService.write
      .insert(sessionLogs)
      .values(newSettledSessionLogs);

    const userOperation = await cdp.evm.sendUserOperation({
      smartAccount: smartAccount,
      network: session.network === '8453' ? 'base' : 'base-sepolia',
      // @ts-ignore
      calls: [
        {
          to: USDC_MAP[session.network].address as `0x${string}`,
          value: BigInt(0),
          data: usdcTransferCalldata as `0x${string}`,
        },
      ],
    });

    return {
      success: true,
    };
  }

  async settleSessionReplayByQuarkId(
    body: SettleSessionReplayByQuarkIdRequestBody,
  ): Promise<SettleSessionReplayResponseBody> {
    const session = await this.drizzleService.read.query.sessions.findFirst({
      where: eq(sessions.id, body.sessionId),
      with: {
        user_player1Id: true,
        user_player2Id: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session does not exist or expired');
    }

    const replay = await Fightcade.GetReplay(body.replayId);

    if (!replay) {
      throw new BadRequestException('Replay does not exist');
    }

    const replayId = replay.quarkid;

    const allSessionLogs =
      await this.drizzleService.read.query.sessionLogs.findMany({
        where: and(eq(sessionLogs.sessionId, body.sessionId)),
        orderBy: desc(sessionLogs.createdAt),
      });

    if (allSessionLogs.some((log) => log.replayId === replayId)) {
      throw new BadRequestException('Replay has already been settled');
    }

    if (allSessionLogs.length === 0) {
      throw new BadRequestException('No bets have been made in this session');
    }

    if (
      allSessionLogs[0].category === 'won' ||
      allSessionLogs[0].category === 'lost'
    ) {
      throw new BadRequestException('Session has already been settled');
    }

    if (replay.players.length !== 2) {
      throw new BadRequestException('Replay is invalid');
    }

    if (!session.user_player2Id) {
      throw new BadRequestException(
        'Session was not joined by a second player',
      );
    }

    this.logger.debug('replay.players[0].name', replay.players[0].name);
    this.logger.debug('replay.players[1].name', replay.players[1].name);
    this.logger.debug(
      'session.user_player1Id.username',
      session.user_player1Id.username,
    );
    this.logger.debug(
      'session.user_player2Id.username',
      session.user_player2Id.username,
    );

    if (
      replay.players[0].name !== session.user_player1Id.username &&
      replay.players[1].name !== session.user_player1Id.username
    ) {
      throw new BadRequestException(
        'Session player does not match replay player 1',
      );
    } else if (
      replay.players[0].name !== session.user_player2Id.username &&
      replay.players[1].name !== session.user_player2Id.username
    ) {
      throw new BadRequestException(
        'Session player does not match replay player 2',
      );
    }

    let player1 = replay.players[0].name;
    let player2 = replay.players[1].name;

    let winnerPlayerUsername = '';
    let loserPlayerUsername = '';

    if (replay.players[0].score === replay.players[1].score) {
      throw new BadRequestException('Replay is a tie');
    }

    if (replay.players[0].score > replay.players[1].score) {
      winnerPlayerUsername = player1;
      loserPlayerUsername = player2;
    } else {
      winnerPlayerUsername = player2;
      loserPlayerUsername = player1;
    }

    let dbPlayer1Username = session.user_player1Id.username;
    let dbPlayer2Username = session.user_player2Id.username;

    let dbPlayer1BetAmount = allSessionLogs.reduce((acc, log) => {
      if (log.userId === session.user_player1Id.id) {
        return acc + SafeBigInt(log.amount);
      }
      return acc;
    }, SafeBigInt(0));

    let dbPlayer2BetAmount = allSessionLogs.reduce((acc, log) => {
      if (log.userId === session.user_player2Id.id) {
        return acc + SafeBigInt(log.amount);
      }
      return acc;
    }, SafeBigInt(0));

    if (winnerPlayerUsername === dbPlayer1Username) {
      if (dbPlayer2BetAmount === SafeBigInt(0)) {
        throw new BadRequestException('Player 2 did not bet');
      }
    } else {
      if (dbPlayer1BetAmount === SafeBigInt(0)) {
        throw new BadRequestException('Player 1 did not bet');
      }
    }

    let winnerUserId =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player1Id.id
        : session.user_player2Id.id;
    let loserUserId =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player2Id.id
        : session.user_player1Id.id;

    let winnerSmartAccountAddress =
      winnerPlayerUsername === dbPlayer1Username
        ? session.user_player1Id.smartAccountAddress
        : session.user_player2Id.smartAccountAddress;

    let transferRawAmount =
      winnerPlayerUsername === dbPlayer1Username
        ? dbPlayer2BetAmount
        : dbPlayer1BetAmount;

    const cdp = this.cdpService.cdp;

    const eoaAccount = await cdp.evm.getOrCreateAccount({
      name: loserUserId,
    });

    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: loserUserId,
      owner: eoaAccount,
    });

    const usdcInterface = new ethers.Interface(ERC20_ABI);

    const usdcTransferCalldata = usdcInterface.encodeFunctionData('transfer', [
      winnerSmartAccountAddress,
      transferRawAmount,
    ]);

    let timestampId = Date.now();

    const newSettledSessionLogs: (typeof sessionLogs.$inferInsert)[] = [
      {
        id: `won_${timestampId}`,
        timestampId: timestampId.toString(),
        sessionId: session.id,
        userId: winnerUserId,
        category: 'won',
        amount: transferRawAmount.toString(),
        createdAt: new Date().toISOString(),
        isSettled: true,
        replayId: replayId,
      },
      {
        id: `lost_${timestampId}`,
        timestampId: timestampId.toString(),
        sessionId: session.id,
        userId: loserUserId,
        category: 'lost',
        amount: (-1n * transferRawAmount).toString(),
        createdAt: new Date().toISOString(),
        isSettled: true,
        replayId: replayId,
      },
    ];

    await this.drizzleService.write
      .insert(sessionLogs)
      .values(newSettledSessionLogs);

    const userOperation = await cdp.evm.sendUserOperation({
      smartAccount: smartAccount,
      network: session.network === '8453' ? 'base' : 'base-sepolia',
      // @ts-ignore
      calls: [
        {
          to: USDC_MAP[session.network].address as `0x${string}`,
          value: BigInt(0),
          data: usdcTransferCalldata as `0x${string}`,
        },
      ],
    });

    return {
      success: true,
    };
  }
}
