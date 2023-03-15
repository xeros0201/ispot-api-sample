import { Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';
import { join } from 'path';

import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchEntity } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playersService: PlayersService,
  ) {}

  public async findById(id: number): Promise<MatchEntity> {
    return this.prismaService.match.findFirst({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        location: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });
  }

  public async create(
    data: CreateMatchDto,
    { homeTeamCsv, awayTeamCsv }: { homeTeamCsv: string; awayTeamCsv: string },
  ): Promise<MatchEntity> {
    const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
      this.playersService.findAllByTeamId(data.homeTeamId),
      this.playersService.findAllByTeamId(data.awayTeamId),
    ]);

    return this.prismaService.match.create({
      data: {
        ..._.omit(data, ['homePlayerIds', 'awayPlayerIds']),
        homeTeamCsv,
        awayTeamCsv,
        players: {
          create: [
            ..._.map(homeTeamPlayers, (player) => ({
              playerId: player.id,
              teamId: player.teamId,
            })),
            ..._.map(awayTeamPlayers, (player) => ({
              playerId: player.id,
              teamId: player.teamId,
            })),
          ],
        },
      },
    });
  }

  public async update(
    id: number,
    data: UpdateMatchDto,
    { homeTeamCsv, awayTeamCsv }: { homeTeamCsv: string; awayTeamCsv: string },
  ): Promise<MatchEntity> {
    const match = await this.prismaService.match.findFirst({ where: { id } });

    if (match.homeTeamCsv !== null) {
      const path = join(process.cwd(), match.homeTeamCsv);

      if (existsSync(path)) {
        unlinkSync(path);
      }
    }

    if (match.awayTeamCsv !== null) {
      const path = join(process.cwd(), match.awayTeamCsv);

      if (existsSync(path)) {
        unlinkSync(path);
      }
    }

    return this.prismaService.match.update({
      where: { id },
      data: {
        ...data,
        homeTeamCsv,
        awayTeamCsv,
      },
    });
  }

  public async delete(id: number): Promise<MatchEntity> {
    return this.prismaService.match.delete({ where: { id } });
  }

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<MatchEntity[]> {
    return this.prismaService.match.findMany({
      where: { seasonId },
      include: {
        awayTeam: true,
        homeTeam: true,
        location: true,
      },
    });
  }

  public async findAllPlayers(id: number): Promise<PlayerEntity[]> {
    return this.playersService.findAllByMatchId(id);
  }
}
