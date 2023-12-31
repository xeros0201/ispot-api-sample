import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { LeagueEntity } from '../leagues/entities/league.entity';
import { LeaguesService } from '../leagues/leagues.service';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { SportEntity } from './entities/sport.entity';

@Injectable()
export class SportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly leaguesService: LeaguesService,
  ) {}

  public async findAll(): Promise<SportEntity[]> {
    return this.prismaService.sport.findMany();
  }

  public async findById(id: number): Promise<SportEntity> {
    return this.prismaService.sport.findFirst({
      where: { id },
      include: { leagues: true },
    });
  }

  public async create(data: CreateSportDto): Promise<SportEntity> {
    return this.prismaService.sport.create({ data });
  }

  public async update(id: number, data: UpdateSportDto): Promise<SportEntity> {
    return this.prismaService.sport.update({ where: { id }, data });
  }

  public async delete(id: number): Promise<SportEntity> {
    return this.prismaService.sport.delete({ where: { id } });
  }

  public async findAllLeagues(id: number): Promise<LeagueEntity[]> {
    return this.leaguesService.findAllBySportId(id);
  }
}
