import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { PlayerEntity } from '../players/entities/player.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamEntity } from './entities/team.entity';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamEntity> {
    return this.teamsService.findById(id);
  }

  @Post('/')
  public async create(@Body() data: CreateTeamDto): Promise<TeamEntity> {
    return this.teamsService.create(data);
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.teamsService.findAllPlayers(id);
  }
}
