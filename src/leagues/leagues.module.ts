import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { SeasonsService } from '../seasons/seasons.service';
import { TeamsService } from '../teams/teams.service';
import { UsersModule } from '../users/users.module';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    SeasonsService,
    TeamsService,
    PlayersService,
    MatchesService,
    AWSS3Service,
  ],
  exports: [LeaguesService],
})
export class LeaguesModule {}
