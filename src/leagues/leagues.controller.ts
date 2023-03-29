import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';

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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'logo',
          maxCount: 1,
        },
      ],
      {
        fileFilter: (_, file, cb: (e: Error, a: boolean) => void): void => {
          const { mimetype, fieldname } = file;

          if (mimetype.includes('image')) {
            cb(null, true);
          } else {
            cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
          }
        },
        storage: diskStorage({ destination: './uploads/' }),
      },
    ),
  )
  @UseGuards(SessionAuthGuard)
  public async create(
    @Body() data: CreateLeagueDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
    },
    @CurrentUser() user: UserEntity,
  ): Promise<LeagueEntity> {
    return this.leaguesService.create(
      data,
      {
        logo: files?.logo?.[0],
      },
      user.id,
    );
  }

  @Put('/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'logo',
          maxCount: 1,
        },
      ],
      {
        fileFilter: (_, file, cb: (e: Error, a: boolean) => void): void => {
          const { mimetype, fieldname } = file;

          if (mimetype.includes('image')) {
            cb(null, true);
          } else {
            cb(new MulterError('LIMIT_UNEXPECTED_FILE', fieldname), false);
          }
        },
        storage: diskStorage({ destination: './uploads/' }),
      },
    ),
  )
  @UseGuards(SessionAuthGuard)
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLeagueDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
    },
    @CurrentUser() user: UserEntity,
  ): Promise<LeagueEntity> {
    return this.leaguesService.update(
      id,
      data,
      {
        logo: files?.logo?.[0],
      },
      user.id,
    );
  }

  @Delete('/:id')
  @UseGuards(SessionAuthGuard)
  public async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeagueEntity> {
    return this.leaguesService.delete(id);
  }
}
