import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { SeasonEntity } from '../seasons/entities/season.entity';
import { SeasonsService } from '../seasons/seasons.service';
import { SportEntity } from '../sports/entities/sport.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UploadToS3Service } from './../common/uploadToS3/uploadToS3.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueEntity } from './entities/league.entity';

@Injectable()
export class LeaguesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly seasonService: SeasonsService,
    private readonly uploadToS3Service: UploadToS3Service,
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
    { logo }: { logo: string },
    userId: UserEntity['id'],
  ): Promise<LeagueEntity> {
    if (logo)
      logo = await this.uploadToS3Service.uploadImageToS3('image', logo, 'png');

    return this.prismaService.league.create({
      data: {
        name: name,
        logo: logo,
        sport: { connect: { id: sportId } },
        createdUser: { connect: { id: userId } },
      },
    });
  }

  public async update(
    id: number,
    data: UpdateLeagueDto,
    userId: UserEntity['id'],
  ): Promise<LeagueEntity> {
    return this.prismaService.league.update({
      where: { id },
      data: { ...data, updatedUserId: userId },
    });
  }

  public async findAllSeasons(id: number): Promise<SeasonEntity[]> {
    return this.seasonService.findAllByLeagueId(id);
  }

  public async delete(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.delete({ where: { id } });
  }
}
