import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { MatchEntity } from '../matches/entities/match.entity';
import { PlayerEntity } from '../players/entities/player.entity';
import { TeamEntity } from '../teams/entities/team.entity';
import { CreateSeasonDto } from './dto/create-season.dto';
import { SeasonEntity } from './entities/season.entity';
import { SeasonsService } from './seasons.service';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SeasonEntity> {
    return this.seasonsService.findById(id);
  }

  @Post()
  public async create(@Body() data: CreateSeasonDto): Promise<SeasonEntity> {
    return this.seasonsService.create(data);
  }

  @Get('/:id/teams')
  public async findAllTeams(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamEntity[]> {
    return this.seasonsService.findAllTeams(id);
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.seasonsService.findAllPlayers(id);
  }

  @Get('/:id/matches')
  public async findAllMatches(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MatchEntity[]> {
    return this.seasonsService.findAllMatches(id);
  }
}
