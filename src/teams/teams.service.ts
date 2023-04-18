import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';

import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playersService: PlayersService,
    private readonly awsS3Service: AWSS3Service,
  ) {}

  public async findAll(): Promise<TeamEntity[]> {
    return this.prismaService.team.findMany({
      include: {
        season: {
          include: { league: true },
        },
      },
    });
  }

  public async findById(id: number): Promise<TeamEntity> {
    return this.prismaService.team.findFirst({
      where: { id },
      include: {
        season: {
          include: { league: true },
        },
      },
    });
  }

  public async create(
    data: CreateTeamDto,
    logo: Express.Multer.File,
  ): Promise<TeamEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'images',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.team.create({ data: { ...data, logo: logoKey } });
  }

  public async update(
    id: number,
    data: UpdateTeamDto,
    logo: Express.Multer.File,
  ): Promise<TeamEntity> {
    let logoKey: string;

    if (!_.isNil(logo)) {
      logoKey = await this.awsS3Service.put(
        'images',
        logo.path,
        _.last(logo.originalname.split('.')),
      );
    }

    return this.prismaService.team.update({
      where: { id },
      data: { ...data, logo: logoKey },
    });
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

  public async getStats(seasonId: number, round?: number): Promise<any> {
    const matches = await this.prismaService.match.findMany({
      where: {
        seasonId,
        ...(!_.isNil(round) ? { round } : {}),
      },
    });

    const teamReports = await this.prismaService.teamReport.findMany({
      where: {
        matchId: { in: _.map(matches, (m) => m.id) },
      },
      include: {
        team: true,
        playersOnTeamReports: {
          include: {
            resultProperty: {
              include: { parent: true },
            },
            player: true,
          },
        },
      },
    });

    return _(teamReports)
      .map((teamReport) => {
        return {
          team: _.pick(teamReport.team, ['id', 'name']),
          score: teamReport.score,
          meta: teamReport.meta,
          players: _(teamReport.playersOnTeamReports)
            .groupBy((s) => s.playerId)
            .map((values, playerId) => {
              const { player } = _.find(
                values,
                (r) => r.playerId === _.toNumber(playerId),
              );

              return {
                player: _.pick(player, ['id', 'name', 'playerNumber']),
                values: _(values)
                  .map((r) => ({
                    resultProperty: r.resultProperty,
                    value: r.value,
                  }))
                  .groupBy((r) => r.resultProperty.parent.name)
                  .mapValues((v) => {
                    return _.transform(
                      v,
                      (r, p) => {
                        _.assign(r, {
                          [p.resultProperty.alias]: {
                            name: p.resultProperty.name,
                            value: p.value,
                          },
                        });
                      },
                      {},
                    );
                  })
                  .value(),
              };
            })
            .value(),
        };
      })
      .value();
  }
}
