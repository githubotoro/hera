import { Module } from '@nestjs/common';
import { ViemService } from './viem.service';
import { CallerViemService } from './caller.viem.service';

@Module({
  imports: [],
  providers: [ViemService, CallerViemService],
  exports: [ViemService, CallerViemService],
})
export class ViemModule {}
