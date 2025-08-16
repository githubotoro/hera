import { Module } from '@nestjs/common';
import { CdpProvider } from './cdp.provider';
import { CdpService } from './cdp.service';

@Module({
  imports: [],
  providers: [...CdpProvider, CdpService],
  exports: [CdpService],
})
export class CdpModule {}
