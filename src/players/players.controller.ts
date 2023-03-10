import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerEntity } from './entities/player.entity';
import { PlayersService } from './players.service';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('/')
  public async findAll(): Promise<PlayerEntity[]> {
    return this.playersService.findAll();
  }

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

  @Put('/:id')
  public async update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    data: UpdatePlayerDto,
  ): Promise<PlayerEntity> {
    return this.playersService.update(id, data);
  }
}
