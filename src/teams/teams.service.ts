import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';

import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playersService: PlayersService,
    private readonly awsS3Service: AWSS3Service,
  ) {}

  public async findAll(): Promise<TeamEntity[]> {
    return this.prismaService.team.findMany({
      include: {
        season: {
          include: { league: true },
        },
      },
    });
  }

  public async findById(id: number): Promise<TeamEntity> {
    return this.prismaService.team.findFirst({
      where: { id },
      include: {
        season: {
          include: { league: true },
        },
      },
    });
  }

  public async create(
    data: CreateTeamDto,
    logo: Express.Multer.File,
  ): Promise<TeamEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'image',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.team.create({ data: { ...data, logo: logoKey } });
  }

  public async update(
    id: number,
    data: UpdateTeamDto,
    logo: Express.Multer.File,
  ): Promise<TeamEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'image',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.team.update({
      where: { id },
      data: { ...data, logo: logoKey },
    });
  }

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<TeamEntity[]> {
    return this.prismaService.team.findMany({
      where: { seasonId },
    });
  }

  public async findAllPlayers(id: number): Promise<PlayerEntity[]> {
    return this.playersService.findAllByTeamId(id);
  }
}
