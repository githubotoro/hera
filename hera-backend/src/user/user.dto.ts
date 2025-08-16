import { ApiProperty } from '@nestjs/swagger';

export class VerifyAuthEmailRequestBody {
  @ApiProperty({
    type: String,
  })
  verificationCode: string;
}

export class VerifyAuthEmailResponseBody {
  @ApiProperty({
    type: String,
  })
  userId: string;

  @ApiProperty({
    type: String,
  })
  userToken: string;
}

export class SendAuthEmailRequestBody {
  @ApiProperty({
    type: String,
  })
  email: string;

  @ApiProperty({
    type: String,
  })
  username: string;
}

export class SendAuthEmailResponseBody {
  @ApiProperty({
    type: Boolean,
  })
  status: boolean;
}

export class GetUserInfoRequestBody {
  @ApiProperty({
    type: String,
  })
  userToken: string;
}

export class BaseTokenInfo {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: Number,
  })
  chainId: number;

  @ApiProperty({
    type: String,
  })
  address: string;

  @ApiProperty({
    type: String,
  })
  symbol: string;

  @ApiProperty({
    type: String,
  })
  name: string;

  @ApiProperty({
    type: String,
  })
  image: string;

  @ApiProperty({
    type: Number,
  })
  decimals: number;
}

export class TokenInfo extends BaseTokenInfo {
  @ApiProperty({
    type: String,
  })
  rawAmount: string;

  @ApiProperty({
    type: Number,
  })
  tokenAmount: number;
}

export class GetUserInfoBalance extends TokenInfo {}

export class GetUserInfoResponseBody {
  @ApiProperty({
    type: String,
  })
  userId: string;

  @ApiProperty({
    type: String,
  })
  username: string;

  @ApiProperty({
    type: String,
  })
  email: string;

  @ApiProperty({
    type: String,
  })
  eoaAddress: string;

  @ApiProperty({
    type: String,
  })
  smartAccountAddress: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        chainId: { type: 'number' },
        address: { type: 'string' },
        symbol: { type: 'string' },
        name: { type: 'string' },
        image: { type: 'string' },
        decimals: { type: 'number' },
        rawAmount: { type: 'string' },
        tokenAmount: { type: 'number' },
      },
      required: [
        'id',
        'chainId',
        'address',
        'symbol',
        'name',
        'image',
        'decimals',
        'rawAmount',
        'tokenAmount',
      ],
    },
  })
  balance: Record<string, GetUserInfoBalance>;
}

export class AllocateBetsRequestBody {
  @ApiProperty({
    type: String,
  })
  sessionToken: string;
}
