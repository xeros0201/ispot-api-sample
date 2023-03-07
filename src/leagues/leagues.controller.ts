import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { CurrentUser } from '../users/users.decorator';
import { SeasonEntity } from './../seasons/entities/season.entity';
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

  @Get('/:id/seasons')
  public async findAllSeasons(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SeasonEntity[]> {
    return this.leaguesService.findAllSeasons(id);
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  public async create(
    @Body() data: CreateLeagueDto,
    @CurrentUser() user: UserEntity,
  ): Promise<LeagueEntity> {
    return this.leaguesService.create(data, user.id);
  }

  @Patch('/:id')
  @UseGuards(SessionAuthGuard)
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLeagueDto,
    @CurrentUser() user: UserEntity,
  ): Promise<LeagueEntity> {
    return this.leaguesService.update(id, data, user.id);
  }

  @Delete('/:id')
  @UseGuards(SessionAuthGuard)
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeagueEntity> {
    return this.leaguesService.delete(id);
  }
}
