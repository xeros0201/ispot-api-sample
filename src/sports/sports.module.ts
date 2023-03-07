import { Module } from '@nestjs/common';
import { MatchesService } from 'src/matches/matches.service';
import { PlayersService } from 'src/players/players.service';
import { SeasonsService } from 'src/seasons/seasons.service';
import { TeamsService } from 'src/teams/teams.service';

import { LeaguesService } from '../leagues/leagues.service';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  controllers: [SportsController],
  providers: [
    SportsService,
    LeaguesService,
    SeasonsService,
    TeamsService,
    MatchesService,
    PlayersService,
  ],
})
export class SportsModule {}
