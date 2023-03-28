import { Module } from '@nestjs/common';

import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { SeasonsService } from '../seasons/seasons.service';
import { TeamsService } from '../teams/teams.service';
import { UploadToS3Service } from './../common/uploadToS3/uploadToS3.service';
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
    UploadToS3Service,
  ],
  exports: [LeaguesService],
})
export class LeaguesModule {}
