import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { SportEntity } from '../sports/entities/sport.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueEntity } from './entities/league.entity';

@Injectable()
export class LeaguesService {
  constructor(private readonly prismaService: PrismaService) {}

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
    userId: UserEntity['id'],
  ): Promise<LeagueEntity> {
    return this.prismaService.league.create({
      data: {
        name: name,
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

  public async delete(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.delete({ where: { id } });
  }
}
