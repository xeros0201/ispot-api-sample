import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { HealthModule } from './health/health.module';
import { LeaguesModule } from './leagues/leagues.module';
import { SeasonsModule } from './seasons/seasons.module';
import { SportsModule } from './sports/sports.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    SportsModule,
    LeaguesModule,
    SeasonsModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
