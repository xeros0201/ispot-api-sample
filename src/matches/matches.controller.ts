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
import { MulterError } from 'multer';

import { PlayerEntity } from '../players/entities/player.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchEntity } from './entities/match.entity';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

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
      },
    ),
  )
  public async create(
    @Body()
    data: CreateMatchDto,
    @UploadedFiles()
    files: {
      homeTeamCsv: Express.Multer.File[];
      awayTeamCsv: Express.Multer.File[];
    },
  ): Promise<MatchEntity> {
    // const [homeTeamCsv] = files.homeTeamCsv;
    // const [awayTeamCsv] = files.awayTeamCsv;
    console.log(files);

    return this.matchesService.create(data);
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
    // const [homeTeamCsv] = files.homeTeamCsv;
    // const [awayTeamCsv] = files.awayTeamCsv;
    console.log(files);

    return this.matchesService.update(id, data);
  }

  @Delete('/:id')
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MatchEntity> {
    return this.matchesService.delete(id);
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.matchesService.findAllPlayers(id);
  }
}
