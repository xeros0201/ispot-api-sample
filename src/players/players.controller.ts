import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import * as _ from 'lodash';

import { UserEntity } from '../users/entities/user.entity';
import { CurrentUser } from '../users/users.decorator';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerEntity } from './entities/player.entity';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('/')
  public async findAll(): Promise<PlayerEntity[]> {
    return this.playersService.findAll();
  }

  @Get('/_stats')
  public async getStatsByProperty(
    @Query('property') property: string,
    @Query('seasonId', ParseIntPipe) seasonId: number,
    @Query('teamId') teamId?: string,
  ): Promise<any> {
    return this.playersService.getStats(property, seasonId, {
      teamId: _.toNumber(teamId) || undefined,
    });
  }

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity> {
    return this.playersService.findById(id);
  }

  @Post('/')
  public async create(
    @Body() data: CreatePlayerDto,
    @CurrentUser() user: UserEntity,
  ): Promise<PlayerEntity> {
    return this.playersService.create(data, user.id);
  }

  @Put('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePlayerDto,
    @CurrentUser() user: UserEntity,
  ): Promise<PlayerEntity> {
    return this.playersService.update(id, data, user.id);
  }

  @Delete('/:id')
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity> {
    return this.playersService.delete(id);
  }
}
