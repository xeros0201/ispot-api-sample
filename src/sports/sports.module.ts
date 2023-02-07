import { Module } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { LeaguesService } from 'src/leagues/leagues.service';

@Module({
  controllers: [SportsController],
  providers: [SportsService, LeaguesService, PrismaService],
})
export class SportsModule {}
