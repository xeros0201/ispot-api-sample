import { Module } from '@nestjs/common';

import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { LeaguesService } from '../leagues/leagues.service';
import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { SeasonsService } from '../seasons/seasons.service';
import { TeamsService } from '../teams/teams.service';
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
    AWSS3Service,
  ],
})
export class SportsModule {}
