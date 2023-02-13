import { Module } from '@nestjs/common';

import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  providers: [PlayersService],
  exports: [PlayersService],
  controllers: [PlayersController],
})
export class PlayersModule {}
