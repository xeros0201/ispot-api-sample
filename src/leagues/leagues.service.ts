import { Injectable } from '@nestjs/common';
// import { Sport } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueEntity } from './entities/league.entity';

@Injectable()
export class LeaguesService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<LeagueEntity[]> {
    return this.prismaService.league.findMany({ include: { sport: true } });
  }

  // public async findAllBySportId(sportId: Sport['id']): Promise<LeagueEntity[]> {
  //   return this.prismaService.league.findMany({ where: { sportId } });
  // }

  public async findById(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.findUnique({
      where: { id },
      include: { sport: true },
    });
  }

  public async create({
    name,
    sportId,
  }: CreateLeagueDto): Promise<LeagueEntity> {
    return this.prismaService.league.create({
      data: {
        name: name,
        sport: {
          connect: { id: sportId },
        },
      },
    });
  }

  public async update(
    id: number,
    data: UpdateLeagueDto,
  ): Promise<LeagueEntity> {
    return this.prismaService.league.update({ where: { id }, data });
  }

  public async delete(id: number): Promise<LeagueEntity> {
    return this.prismaService.league.delete({ where: { id } });
  }
}
