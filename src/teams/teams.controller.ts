import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';

import { PlayerEntity } from '../players/entities/player.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamEntity } from './entities/team.entity';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('/')
  public async findAll(): Promise<TeamEntity[]> {
    return this.teamsService.findAll();
  }

  @Get('/_stats')
  public async getStats(
    @Query('round', ParseIntPipe) round: number,
  ): Promise<any> {
    return this.teamsService.getStats(round);
  }

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamEntity> {
    return this.teamsService.findById(id);
  }

  @Post('/')
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: (
        _,
        { mimetype, fieldname },
        cb: (e: Error, a: boolean) => void,
      ): void => {
        if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype)) {
          cb(null, true);
        } else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
        }
      },
      storage: diskStorage({ destination: './uploads/' }),
    }),
  )
  public async create(
    @Body() data: CreateTeamDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TeamEntity> {
    return this.teamsService.create(data, file);
  }

  @Put('/:id')
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: (
        _,
        { mimetype, fieldname },
        cb: (e: Error, a: boolean) => void,
      ): void => {
        if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype)) {
          cb(null, true);
        } else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
        }
      },
      storage: diskStorage({ destination: './uploads/' }),
    }),
  )
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTeamDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TeamEntity> {
    return this.teamsService.update(id, data, file);
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.teamsService.findAllPlayers(id);
  }
}
