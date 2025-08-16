import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  GetUserInfoRequestBody,
  GetUserInfoResponseBody,
  SendAuthEmailRequestBody,
  SendAuthEmailResponseBody,
  VerifyAuthEmailRequestBody,
  VerifyAuthEmailResponseBody,
} from './user.dto';

@ApiTags('User')
@Controller('/api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/auth/email')
  @ApiOkResponse({
    type: SendAuthEmailResponseBody,
  })
  async sendAuthEmail(
    @Body() body: SendAuthEmailRequestBody,
  ): Promise<SendAuthEmailResponseBody> {
    return this.userService.sendAuthEmail(body);
  }

  @Post('/auth/verify')
  @ApiOkResponse({
    type: VerifyAuthEmailResponseBody,
  })
  async verifyAuthEmail(
    @Body() body: VerifyAuthEmailRequestBody,
  ): Promise<VerifyAuthEmailResponseBody> {
    return this.userService.verifyAuthEmail(body);
  }

  @Post('/info')
  @ApiOkResponse({
    type: GetUserInfoResponseBody,
  })
  async getUserInfo(
    @Body() body: GetUserInfoRequestBody,
  ): Promise<GetUserInfoResponseBody> {
    return this.userService.getUserInfo(body);
  }
}
