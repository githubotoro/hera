import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { CdpModule } from '../cdp/cdp.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ResendService } from './resend.service';
import { ViemModule } from '../viem/viem.module';

@Module({
  imports: [DrizzleModule, CdpModule, ViemModule],
  controllers: [UserController],
  providers: [UserService, ResendService],
  exports: [UserService, ResendService],
})
export class UserModule {}
