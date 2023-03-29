import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { UsersModule } from 'src/users/users.module';

import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { TeamsService } from '../teams/teams.service';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SeasonsController],
  providers: [SeasonsService, MatchesService, PlayersService, TeamsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
