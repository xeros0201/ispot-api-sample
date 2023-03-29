import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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

  @Get('/:id')
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamEntity> {
    return this.teamsService.findById(id);
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
  public async create(
    @Body() data: CreateTeamDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
    },
  ): Promise<TeamEntity> {
    return this.teamsService.create(data, {
      logo: files?.logo?.[0],
    });
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
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTeamDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
    },
  ): Promise<TeamEntity> {
    return this.teamsService.update(id, data, {
      logo: files?.logo?.[0],
    });
  }

  @Get('/:id/players')
  public async findAllPlayers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerEntity[]> {
    return this.teamsService.findAllPlayers(id);
  }
}
