import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './config/config';
import { CdpModule } from './cdp/cdp.module';
import { UserModule } from './user/user.module';
import { SessionModule } from './session/session.module';
import { ViemModule } from './viem/viem.module';

const CONFIG = AppConfig();

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig],
    }),
    JwtModule.register({
      global: true,
      secret: CONFIG.JWT_SECRET,
      signOptions: { expiresIn: '365d' },
    }),
    CdpModule,
    UserModule,
    SessionModule,
    ViemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
