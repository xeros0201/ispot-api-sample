import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';

import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { SeasonsService } from '../seasons/seasons.service';
import { SportEntity } from '../sports/entities/sport.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueEntity } from './entities/league.entity';

@Injectable()
export class LeaguesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly seasonService: SeasonsService,
    private readonly awsS3Service: AWSS3Service,
  ) {}

  public async findAll(): Promise<LeagueEntity[]> {
    return this.prismaService.league.findMany({ include: { sport: true } });
  }

  public async findAllBySportId(
    sportId: SportEntity['id'],
  ): Promise<LeagueEntity[]> {
    return this.prismaService.league.findMany({
      where: { sportId },
    });
  }

  public async findById(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.findFirst({
      where: { id },
      include: { sport: true },
    });
  }

  public async create(
    { name, sportId }: CreateLeagueDto,
    logo: Express.Multer.File,
    userId: UserEntity['id'],
  ): Promise<LeagueEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'images',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.league.create({
      data: {
        name: name,
        logo: logoKey,
        sport: { connect: { id: sportId } },
        createdUser: { connect: { id: userId } },
      },
    });
  }

  public async update(
    id: number,
    data: UpdateLeagueDto,
    logo: Express.Multer.File,
    userId: UserEntity['id'],
  ): Promise<LeagueEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'images',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.league.update({
      where: { id },
      data: { ...data, logo: logoKey, updatedUserId: userId },
    });
  }

  public async findAllSeasons(id: number): Promise<SeasonEntity[]> {
    return this.seasonService.findAllByLeagueId(id);
  }

  public async delete(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.delete({ where: { id } });
  }
}
