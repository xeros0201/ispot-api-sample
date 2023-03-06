import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playersService: PlayersService,
  ) {}

  public async findAll(): Promise<TeamEntity[]> {
    return this.prismaService.team.findMany();
  }

  public async findById(id: number): Promise<TeamEntity> {
    return this.prismaService.team.findFirst({
      where: { id },
    });
  }

  public async create(data: CreateTeamDto): Promise<TeamEntity> {
    return this.prismaService.team.create({ data });
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
