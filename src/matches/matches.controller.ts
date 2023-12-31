import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as _ from 'lodash';
import { diskStorage, MulterError } from 'multer';

import { PlayerEntity } from '../players/entities/player.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchEntity } from './entities/match.entity';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('/')
  public async findAll(): Promise<MatchEntity[]> {
    return this.matchesService.findAll();
  }

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MatchEntity> {
    return this.matchesService.findById(id);
  }

  @Post('/')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'homeTeamCsv',
          maxCount: 1,
        },
        {
          name: 'awayTeamCsv',
          maxCount: 1,
        },
      ],
      {
        fileFilter: (
          _,
          { mimetype, fieldname },
          cb: (e: Error, a: boolean) => void,
        ): void => {
          if (mimetype === 'text/csv') {
            cb(null, true);
          } else {
            cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
          }
        },
        storage: diskStorage({ destination: './uploads/' }),
      },
    ),
  )
  public async create(
    @Body()
    formData: CreateMatchDto,
    @UploadedFiles()
    files: {
      homeTeamCsv?: Express.Multer.File[];
      awayTeamCsv?: Express.Multer.File[];
    },
  ): Promise<MatchEntity> {
    let homeTeamCsv: string;
    let awayTeamCsv: string;

    if (!_.isEmpty(files.homeTeamCsv)) {
      homeTeamCsv = _.head(files.homeTeamCsv).path;
    }

    if (!_.isEmpty(files.awayTeamCsv)) {
      awayTeamCsv = _.head(files.awayTeamCsv).path;
    }

    return this.matchesService.create(formData, {
      homeTeamCsv,
      awayTeamCsv,
    });
  }

  @Put('/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'homeTeamCsv',
          maxCount: 1,
        },
        {
          name: 'awayTeamCsv',
          maxCount: 1,
        },
      ],
      {
        fileFilter: (
          _,
          { mimetype, fieldname },
          cb: (e: Error, a: boolean) => void,
        ): void => {
          if (mimetype === 'text/csv') {
            cb(null, true);
          } else {
            cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
          }
        },
        storage: diskStorage({ destination: './uploads/' }),
      },
    ),
  )
  public async update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    data: UpdateMatchDto,
    @UploadedFiles()
    files: {
      homeTeamCsv: Express.Multer.File[];
      awayTeamCsv: Express.Multer.File[];
    },
  ): Promise<MatchEntity> {
    let homeTeamCsv: string;
    let awayTeamCsv: string;

    if (!_.isEmpty(files.homeTeamCsv)) {
      homeTeamCsv = _.head(files.homeTeamCsv).path;
    }

    if (!_.isEmpty(files.awayTeamCsv)) {
      awayTeamCsv = _.head(files.awayTeamCsv).path;
    }

    return this.matchesService.update(id, data, {
      homeTeamCsv,
      awayTeamCsv,
    });
  }

  @Get('/:id/_publish')
  public async publish(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.matchesService.publish(id);
  }

  @Delete('/:id')
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MatchEntity> {
    return this.matchesService.delete(id);
  }

  @Delete('/:id/players/:playerId')
  public async removePlayer(
    @Param('id', ParseIntPipe) id: number,
    @Param('playerId', ParseIntPipe) playerId: number,
  ): Promise<MatchEntity> {
    return this.matchesService.removePlayer(id, playerId);
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.matchesService.findAllPlayers(id);
  }

  @Get('/:id/_stats')
  public async getStats(@Param('id', ParseIntPipe) id: number): Promise<{
    reports: any;
    teamReports: any;
    leaders: any;
  }> {
    return this.matchesService.getStats(id);
  }
}
