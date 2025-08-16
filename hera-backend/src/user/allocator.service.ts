import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { AllocateBetsRequestBody } from './user.dto';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { sessions } from '../drizzle/schema';
import { Fightcade } from 'fightcade-api';

@Injectable()
export class AllocatorService {
  private readonly logger = new Logger(AllocatorService.name);

  public isAllocating = false;

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly jwtService: JwtService,
  ) {}

  async allocateBets(body: AllocateBetsRequestBody) {
    if (this.isAllocating) {
      return {
        status: false,
      };
    }

    this.isAllocating = true;

    try {
      const sessionToken = this.jwtService.verify(body.sessionToken);

      const session = await this.drizzleService.read.query.sessions.findFirst({
        where: eq(sessions.id, sessionToken.sessionId),
        with: {
          user_player1Id: true,
          user_player2Id: true,
        },
      });

      if (!session) {
        throw new BadRequestException('Session does not exist or expired');
      }

      const player1Replays = await Fightcade.GetUserReplays(
        session.user_player1Id.username,
      );

      const player2Replays = await Fightcade.GetUserReplays(
        session.user_player2Id.username,
      );
    } catch (error) {
      this.isAllocating = false;

      throw new InternalServerErrorException(error);
    }

    this.isAllocating = false;

    return {
      status: true,
    };
  }
}
