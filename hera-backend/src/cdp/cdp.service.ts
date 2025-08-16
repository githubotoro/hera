import { Inject, Injectable } from '@nestjs/common';
import { CdpClient } from '@coinbase/cdp-sdk';
import { cdpProvider } from './cdp.provider';

@Injectable()
export class CdpService {
  constructor(
    @Inject(cdpProvider)
    public readonly cdp: CdpClient,
  ) {}
}
