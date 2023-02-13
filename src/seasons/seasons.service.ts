import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { MatchEntity } from '../matches/entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { TeamEntity } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { SeasonEntity } from './entities/season.entity';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    private readonly matchesService: MatchesService,
  ) {}

  public async findById(id: number): Promise<SeasonEntity> {
    return this.prismaService.season.findFirst({
      where: { id },
      include: {
        league: {
          include: { sport: true },
        },
      },
    });
  }

  public async create(data: CreateSeasonDto): Promise<SeasonEntity> {
    return this.prismaService.season.create({ data });
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
