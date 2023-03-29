import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { TeamsService } from '../teams/teams.service';
import { UsersModule } from '../users/users.module';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SeasonsController],
  providers: [
    SeasonsService,
    MatchesService,
    PlayersService,
    TeamsService,
    AWSS3Service,
  ],
  exports: [SeasonsService],
})
export class SeasonsModule {}
