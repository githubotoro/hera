import { Module } from '@nestjs/common';
import { DrizzleProvider } from './drizzle.provider';
import { GenericDrizzleService } from './generic.drizzle.service';
import { DrizzleService } from './drizzle.service';

@Module({
  imports: [],
  providers: [
    ...DrizzleProvider,
    {
      provide: DrizzleService,
      useFactory: async (writeProvider: any, readProvider: any) => {
        return new DrizzleService(writeProvider, readProvider);
      },
      inject: ['DrizzleWriteProvider', 'DrizzleReadProvider'],
    },
    {
      provide: GenericDrizzleService,
      useFactory: async (db: DrizzleService) => {
        return new GenericDrizzleService(db);
      },
      inject: [DrizzleService],
    },
  ],
  exports: [DrizzleService, GenericDrizzleService],
})
export class DrizzleModule {}
