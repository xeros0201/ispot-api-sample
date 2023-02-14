import { Module } from '@nestjs/common';
import { PlayersService } from 'src/players/players.service';

import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  providers: [MatchesService, PlayersService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
