import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { MatchEntity } from '../matches/entities/match.entity';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { TeamEntity } from '../teams/entities/team.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerEntity } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findById(id: number): Promise<PlayerEntity> {
    return this.prismaService.player.findFirst({
      where: { id },
      include: { team: true },
    });
  }

  public async create(data: CreatePlayerDto): Promise<PlayerEntity> {
    return this.prismaService.player.create({ data });
  }

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<PlayerEntity[]> {
    return this.prismaService.player.findMany({
      where: {
        team: { seasonId: seasonId },
      },
      include: { team: true },
    });
  }

  public async findAllByTeamId(
    teamId: TeamEntity['id'],
  ): Promise<PlayerEntity[]> {
    return this.prismaService.player.findMany({
      where: { teamId },
      include: { team: true },
    });
  }

  public async findAllByMatchId(
    matchId: MatchEntity['id'],
  ): Promise<PlayerEntity[]> {
    return this.prismaService.player.findMany({
      where: { matches: { some: { matchId } } },
      include: { team: true },
    });
  }
}
