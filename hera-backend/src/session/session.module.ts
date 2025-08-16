import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ViemModule } from '../viem/viem.module';
import { CdpModule } from '../cdp/cdp.module';

@Module({
  imports: [DrizzleModule, ViemModule, CdpModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
