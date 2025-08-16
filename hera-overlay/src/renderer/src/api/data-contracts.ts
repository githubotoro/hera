/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SendAuthEmailRequestBody {
  email: string;
  username: string;
}

export interface SendAuthEmailResponseBody {
  status: boolean;
}

export interface VerifyAuthEmailRequestBody {
  verificationCode: string;
}

export interface VerifyAuthEmailResponseBody {
  userId: string;
  userToken: string;
}

export interface GetUserInfoRequestBody {
  userToken: string;
}

export interface GetUserInfoResponseBody {
  userId: string;
  username: string;
  email: string;
  eoaAddress: string;
  smartAccountAddress: string;
  balance: Record<
    string,
    {
      id: string;
      chainId: number;
      address: string;
      symbol: string;
      name: string;
      image: string;
      decimals: number;
      rawAmount: string;
      tokenAmount: number;
    }
  >;
}

export interface CreateSessionRequestBody {
  network: string;
  userToken: string;
}

export interface CreateSessionResponseBody {
  sessionId: string;
  sessionToken: string;
}

export interface JoinSessionRequestBody {
  userToken: string;
  sessionId: string;
}

export interface JoinSessionResponseBody {
  sessionId: string;
  sessionToken: string;
}

export interface GetSessionInfoRequestBody {
  sessionToken: string;
}

export interface TokenInfo {
  id: string;
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  image: string;
  decimals: number;
  rawAmount: string;
  tokenAmount: number;
}

export interface GetSessionInfoPlayer {
  id: string;
  username: string;
  tokenInfo: TokenInfo;
}

export interface GetSessionInfoResponseBody {
  sessionId: string;
  network: string;
  player1: GetSessionInfoPlayer;
  player2?: GetSessionInfoPlayer;
}

export interface BetSessionRequestBody {
  sessionToken: string;
  rawAmount: string;
}

export interface BetSessionResponseBody {
  success: boolean;
}
