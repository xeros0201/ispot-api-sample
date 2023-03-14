import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { LeagueEntity } from 'src/leagues/entities/league.entity';

import { MatchEntity } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { TeamEntity } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { UserEntity } from '../users/entities/user.entity';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { SeasonEntity } from './entities/season.entity';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
  ) {}

  public async findAll(): Promise<SeasonEntity[]> {
    return this.prismaService.season.findMany({
      include: {
        league: { include: { sport: true } },
      },
    });
  }

  public async findById(id: number): Promise<SeasonEntity> {
    return this.prismaService.season.findFirst({
      where: { id },
      include: {
        league: { include: { sport: true } },
      },
    });
  }

  public async create(
    data: CreateSeasonDto,
    userId: UserEntity['id'],
  ): Promise<SeasonEntity> {
    return this.prismaService.season.create({
      data: { ...data, createdUserId: userId },
    });
  }

  public async update(
    id: number,
    data: UpdateSeasonDto,
    userId: UserEntity['id'],
  ): Promise<SeasonEntity> {
    return this.prismaService.season.update({
      where: { id },
      data: { ...data, updatedUserId: userId },
    });
  }

  public async findAllByLeagueId(
    leagueId: LeagueEntity['id'],
  ): Promise<SeasonEntity[]> {
    return this.prismaService.season.findMany({
      where: { leagueId },
    });
  }

  public async findAllTeams(id: number): Promise<TeamEntity[]> {
    return this.teamsService.findAllBySeasonId(id);
  }

  public async findAllPlayers(id: number): Promise<PlayerEntity[]> {
    return this.playersService.findAllBySeasonId(id);
  }

  public async findAllMatches(id: number): Promise<MatchEntity[]> {
    return this.matchesService.findAllBySeasonId(id);
  }
}
