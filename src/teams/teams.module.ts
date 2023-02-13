import { Module } from '@nestjs/common';
import { PlayersService } from 'src/players/players.service';

import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  providers: [TeamsService, PlayersService],
  exports: [TeamsService],
  controllers: [TeamsController],
})
export class TeamsModule {}
