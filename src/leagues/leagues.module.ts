import { Module } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { LeaguesController } from './leagues.controller';
import { PrismaService } from 'src/common/services/prisma.service';

@Module({
  controllers: [LeaguesController],
  providers: [LeaguesService, PrismaService],
})
export class LeaguesModule {}
