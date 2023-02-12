import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { HealthModule } from './health/health.module';
import { LeaguesModule } from './leagues/leagues.module';
import { SportsModule } from './sports/sports.module';

@Module({
  imports: [
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    SportsModule,
    LeaguesModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
