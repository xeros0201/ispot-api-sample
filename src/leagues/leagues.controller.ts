import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueEntity } from './entities/league.entity';
import { LeaguesService } from './leagues.service';

@Controller('leagues')
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Get('/')
  public async findAll(): Promise<LeagueEntity[]> {
    return this.leaguesService.findAll();
  }

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeagueEntity> {
    return this.leaguesService.findById(id);
  }

  @Post('/')
  public async create(@Body() data: CreateLeagueDto): Promise<LeagueEntity> {
    return this.leaguesService.create(data);
  }

  @Put('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLeagueDto,
  ): Promise<LeagueEntity> {
    return this.leaguesService.update(id, data);
  }

  @Delete('/:id')
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeagueEntity> {
    return this.leaguesService.delete(id);
  }
}
