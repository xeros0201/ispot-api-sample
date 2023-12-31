import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'nestjs-prisma';
import { S3Module } from 'nestjs-s3';

import { AuthModule } from './auth/auth.module';
import { AWSS3Module } from './aws-s3/aws-s3.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { HealthModule } from './health/health.module';
import { LeaguesModule } from './leagues/leagues.module';
import { LocationsModule } from './locations/locations.module';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { SeasonsModule } from './seasons/seasons.module';
import { SportsModule } from './sports/sports.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    S3Module.forRoot({
      config: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.AWS_S3_ENDPOINT,
        s3BucketEndpoint: true,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      },
    }),
    HealthModule,
    AuthModule,
    AWSS3Module,
    SportsModule,
    LeaguesModule,
    SeasonsModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
    UsersModule,
    LocationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
