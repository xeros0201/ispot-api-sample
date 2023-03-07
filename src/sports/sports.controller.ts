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
import { ApiTags } from '@nestjs/swagger';

import { LeagueEntity } from '../leagues/entities/league.entity';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { SportEntity } from './entities/sport.entity';
import { SportsService } from './sports.service';

@ApiTags('sports')
@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get('/')
  public async findAll(): Promise<SportEntity[]> {
    return this.sportsService.findAll();
  }

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SportEntity> {
    return this.sportsService.findById(+id);
  }

  @Post('/')
  public async create(@Body() data: CreateSportDto): Promise<SportEntity> {
    return this.sportsService.create(data);
  }

  @Put('/:id')
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSportDto,
  ): Promise<SportEntity> {
    return this.sportsService.update(id, data);
  }

  @Delete('/:id')
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SportEntity> {
    return this.sportsService.delete(id);
  }

  @Get(':id/leagues')
  public async findAllLeagues(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeagueEntity[]> {
    return this.sportsService.findAllLeagues(id);
  }
}
