import { BadRequestException, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';

import { MatchEntity } from '../matches/entities/match.entity';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { TeamEntity } from '../teams/entities/team.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerEntity } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(private readonly prismaService: PrismaService) { }

  public async findAll(): Promise<PlayerEntity[]> {
    return this.prismaService.player.findMany({
      include: {
        team: {
          include: { season: { include: { league: true } } },
        },
        createdUser: true,
        updatedUser: true,
      },
    });
  }

  public async findById(id: number): Promise<PlayerEntity> {
    return this.prismaService.player.findFirst({
      where: { id },
      include: {
        team: true,
        createdUser: true,
        updatedUser: true,
      },
    });
  }

  public async create(
    data: CreatePlayerDto,
    userId: UserEntity['id'],
  ): Promise<PlayerEntity> {
    return this.prismaService.player.create({
      data: {
        ...data,
        createdUserId: userId,
      },
    });
  }

  public async update(
    id: number,
    data: UpdatePlayerDto,
    userId: UserEntity['id'],
  ): Promise<PlayerEntity> {
    return this.prismaService.player.update({
      where: { id },
      data: {
        ...data,
        updatedUserId: userId,
      },
    });
  }

  public async delete(id: number): Promise<PlayerEntity> {
    return this.prismaService.player.delete({ where: { id } });
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
      where: { playersOnMatches: { some: { matchId } } },
      include: { team: true },
    });
  }

  public async getStats(
    alias: string,
    { teamId }: { teamId?: number },
  ): Promise<any> {
    const resultProperty = await this.prismaService.resultProperty.findFirst({
      where: { alias },
    });

    if (_.isNil(resultProperty)) {
      throw new BadRequestException('No Property found!');
    }

    const results = await this.prismaService.playersOnTeamReports.groupBy({
      by: ['playerId'],
      where: {
        resultPropertyId: resultProperty.id,
        ...(!_.isNil(teamId) ? { player: { teamId } } : {}),
      },
      _sum: { value: true },
      orderBy: [{ _sum: { value: 'desc' } }],
      take: 10,
    });

    const players = await this.prismaService.player.findMany({
      where: {
        id: { in: _.map(results, (r) => r.playerId) },
      },
      include: {
        team: {
          select: {
            season: true,
            seasonId: true,
            id: true,
            name: true,
          },
        },
      },
    });

    return _(players)
      .map((player) => {
        const p = _.find(results, (r) => r.playerId === player.id);

        _.assign(player, { total: p._sum.value });

        return _.omit(player, [
          'createdDate',
          'createdUserId',
          'updatedDate',
          'updatedUserId',
        ]);
      })
      .orderBy('total', 'desc')
      .value();
  }
}
