import { Module } from '@nestjs/common';
import { MatchesService } from 'src/matches/matches.service';
import { PlayersService } from 'src/players/players.service';
import { SeasonsService } from 'src/seasons/seasons.service';
import { TeamsService } from 'src/teams/teams.service';

import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';

@Module({
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    SeasonsService,
    TeamsService,
    PlayersService,
    MatchesService,
  ],
  exports: [LeaguesService],
})
export class LeaguesModule {}
