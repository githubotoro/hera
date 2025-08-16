import { Body, Controller, Post } from '@nestjs/common';
import { SessionService } from './session.service';
import {
  BetSessionRequestBody,
  BetSessionResponseBody,
  CreateSessionRequestBody,
  CreateSessionResponseBody,
  GetHistoryRequestBody,
  GetSessionInfoRequestBody,
  GetSessionInfoResponseBody,
  JoinSessionRequestBody,
  JoinSessionResponseBody,
} from './session.dto';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';

@Controller('/api/v1/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/create')
  @ApiOkResponse({
    type: CreateSessionResponseBody,
  })
  async createSession(
    @Body() body: CreateSessionRequestBody,
  ): Promise<CreateSessionResponseBody> {
    return this.sessionService.createSession(body);
  }

  @Post('/join')
  @ApiOkResponse({
    type: JoinSessionResponseBody,
  })
  async joinSession(
    @Body() body: JoinSessionRequestBody,
  ): Promise<JoinSessionResponseBody> {
    return this.sessionService.joinSession(body);
  }

  @Post('/info')
  @ApiOkResponse({
    type: GetSessionInfoResponseBody,
  })
  async getSessionInfo(
    @Body() body: GetSessionInfoRequestBody,
  ): Promise<GetSessionInfoResponseBody> {
    return this.sessionService.getSessionInfo(body);
  }

  @Post('/bet')
  @ApiOkResponse({
    type: BetSessionResponseBody,
  })
  async betSession(
    @Body() body: BetSessionRequestBody,
  ): Promise<BetSessionResponseBody> {
    return this.sessionService.betSession(body);
  }

  // @Post('/history')
  // @ApiResponse({
  //   type: GetHistoryResponseBody,
  // })
  // async getHistory(@Body() body: GetHistoryRequestBody) {
  //   return this.sessionService.getHistory(body);
  // }
}
