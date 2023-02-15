import { Module } from '@nestjs/common';

import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService],
})
export class PlayersModule {}
