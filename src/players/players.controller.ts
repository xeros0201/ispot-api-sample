import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerEntity } from './entities/player.entity';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity> {
    return this.playersService.findById(id);
  }

  @Post('/')
  public async create(@Body() data: CreatePlayerDto): Promise<PlayerEntity> {
    return this.playersService.create(data);
  }
}
