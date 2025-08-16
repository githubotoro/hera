import { Transform } from 'class-transformer';
import { BaseRequestBody } from '../drizzle/drizzle.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TokenInfo } from '../user/user.dto';
import { IsOptional } from 'class-validator';

export class CreateSessionRequestBody {
  @ApiProperty({
    type: String,
  })
  network: string;

  @ApiProperty({
    type: String,
  })
  userToken: string;
}

export class CreateSessionResponseBody {
  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
  })
  sessionCode: string;

  @ApiProperty({
    type: String,
  })
  sessionToken: string;
}

export class JoinSessionRequestBody {
  @ApiProperty({
    type: String,
  })
  userToken: string;

  @ApiProperty({
    type: String,
  })
  @Transform(({ value }) => value.toLowerCase().trim())
  sessionCode: string;
}

export class JoinSessionResponseBody {
  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
  })
  sessionCode: string;

  @ApiProperty({
    type: String,
  })
  sessionToken: string;
}

export class GetSessionInfoRequestBody {
  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  userToken?: string;
}

export class GetSessionTokenInfo extends TokenInfo {
  @ApiProperty({
    type: String,
  })
  balanceRawAmount: string;

  @ApiProperty({
    type: Number,
  })
  balanceTokenAmount: number;
}

export class GetSessionInfoPlayer {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
  })
  username: string;

  @ApiProperty({
    type: GetSessionTokenInfo,
  })
  tokenInfo: GetSessionTokenInfo;

  @ApiProperty({
    type: Boolean,
  })
  isOnline: boolean;
}

export class GetSessionInfoResponseBody {
  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
  })
  sessionCode: string;

  @ApiProperty({
    type: String,
  })
  network: string;

  @ApiProperty({
    type: GetSessionInfoPlayer,
  })
  player1: GetSessionInfoPlayer;

  @ApiProperty({
    type: GetSessionInfoPlayer,
    required: false,
  })
  @IsOptional()
  player2?: GetSessionInfoPlayer;

  @ApiProperty({
    type: String,
  })
  expiresAt: string;
}

export class BetSessionRequestBody {
  @ApiProperty({
    type: String,
  })
  sessionToken: string;

  @ApiProperty({
    type: String,
  })
  rawAmount: string;
}

export class BetSessionResponseBody {
  @ApiProperty({
    type: Boolean,
  })
  success: boolean;
}

export class GetHistoryRequestBody extends BaseRequestBody {
  @ApiProperty({
    type: String,
  })
  userToken: string;
}

export class GetHistoryResponseBodyDataElement {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
  })
  category: string;

  @ApiProperty({
    type: String,
  })
  timestampId: string;

  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
  })
  userId: string;

  @ApiProperty({
    type: String,
  })
  rawAmount: string;

  @ApiProperty({
    type: String,
  })
  tokenAmount: number;

  @ApiProperty({
    type: String,
  })
  createdAt: string;
}

export class GetHistoryResponseBody {
  @ApiProperty({
    type: [GetHistoryResponseBodyDataElement],
  })
  data: GetHistoryResponseBodyDataElement[];
}

export class SettleSessionReplayRequestBody {
  @ApiProperty({
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    type: String,
  })
  userId: string;
}

export class SettleSessionReplayResponseBody {
  @ApiProperty({
    type: Boolean,
  })
  success: boolean;
}
