import { Module } from '@nestjs/common';

import { MatchesService } from '../matches/matches.service';
import { PlayersService } from '../players/players.service';
import { TeamsService } from '../teams/teams.service';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';

@Module({
  controllers: [SeasonsController],
  providers: [SeasonsService, MatchesService, PlayersService, TeamsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
