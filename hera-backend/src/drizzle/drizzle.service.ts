import { Inject, Injectable } from '@nestjs/common';
import { DrizzleReadProvider, DrizzleWriteProvider } from './drizzle.provider';
import { DB } from '../types/db';

@Injectable()
export class DrizzleService {
  constructor(
    @Inject(DrizzleWriteProvider)
    public readonly write: DB,
    @Inject(DrizzleReadProvider)
    public readonly read: DB,
  ) {}
}
