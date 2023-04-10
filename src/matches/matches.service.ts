import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MatchStatus, ResultProperty } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync, unlinkSync } from 'fs';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';
import { InjectS3, S3 } from 'nestjs-s3';
import { v4 as uuid } from 'uuid';

import { PlayerEntity } from '../players/entities/player.entity';
import { PlayersService } from '../players/players.service';
import { SeasonEntity } from '../seasons/entities/season.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchEntity } from './entities/match.entity';
import { CSVProperty } from './matches.types';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly prismaService: PrismaService,
    private readonly playersService: PlayersService,
  ) {}

  public async findAll(): Promise<MatchEntity[]> {
    return this.prismaService.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        location: true,
        teamReports: true,
      },
    });
  }

  public async findById(id: number): Promise<MatchEntity> {
    return this.prismaService.match.findFirst({
      where: { id },
      include: {
        season: {
          include: {
            league: true,
          },
        },
        homeTeam: true,
        awayTeam: true,
        location: true,
        players: {
          include: { player: true },
        },
      },
    });
  }

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<MatchEntity[]> {
    return this.prismaService.match.findMany({
      where: { seasonId },
      include: {
        season: { include: { league: true } },
        awayTeam: true,
        homeTeam: true,
        location: true,
        teamReports: true,
      },
    });
  }

  public async create(
    data: CreateMatchDto,
    {
      homeTeamCsv,
      awayTeamCsv,
    }: {
      homeTeamCsv?: string;
      awayTeamCsv?: string;
    },
  ): Promise<MatchEntity> {
    if (!_.isNil(homeTeamCsv)) {
      homeTeamCsv = await this.uploadCsvToS3('csv', homeTeamCsv);
    }

    if (!_.isNil(awayTeamCsv)) {
      awayTeamCsv = await this.uploadCsvToS3('csv', awayTeamCsv);
    }

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
          createMany: {
            data: [
              ..._.map(data.homePlayerIds, (id, k) => {
                const player = _.find(homeTeamPlayers, (p) => p.id === +id);

                return {
                  teamId: player.teamId,
                  playerId: player.id,
                  playerNumber: _.toNumber(k.substring(1)),
                };
              }),
              ..._.map(data.awayPlayerIds, (id, k) => {
                const player = _.find(awayTeamPlayers, (p) => p.id === +id);

                return {
                  teamId: player.teamId,
                  playerId: player.id,
                  playerNumber: _.toNumber(k.substring(1)),
                };
              }),
            ],
          },
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

    if (match.status === MatchStatus.PUBLISHED) {
      throw new BadRequestException();
    }

    if (!_.isNil(homeTeamCsv)) {
      homeTeamCsv = await this.uploadCsvToS3(
        'csv',
        homeTeamCsv,
        match.homeTeamCsv,
      );
    }

    if (!_.isNil(awayTeamCsv)) {
      awayTeamCsv = await this.uploadCsvToS3(
        'csv',
        awayTeamCsv,
        match.awayTeamCsv,
      );
    }

    const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
      this.playersService.findAllByTeamId(data.homeTeamId),
      this.playersService.findAllByTeamId(data.awayTeamId),
    ]);

    return this.prismaService.match.update({
      where: { id },
      data: {
        ..._.omit(data, ['homePlayerIds', 'awayPlayerIds']),
        homeTeamCsv,
        awayTeamCsv,
        players: {
          deleteMany: {},
          createMany: {
            data: [
              ..._.map(data.homePlayerIds, (id, k) => {
                const player = _.find(homeTeamPlayers, (p) => p.id === +id);

                return {
                  teamId: player.teamId,
                  playerId: player.id,
                  playerNumber: _.toNumber(k.substring(1)),
                };
              }),
              ..._.map(data.awayPlayerIds, (id, k) => {
                const player = _.find(awayTeamPlayers, (p) => p.id === +id);

                return {
                  teamId: player.teamId,
                  playerId: player.id,
                  playerNumber: _.toNumber(k.substring(1)),
                };
              }),
            ],
          },
        },
      },
    });
  }

  public async delete(id: number): Promise<MatchEntity> {
    return this.prismaService.match.delete({ where: { id } });
  }

  public async removePlayer(
    id: number,
    playerId: number,
  ): Promise<MatchEntity> {
    return this.prismaService.match.update({
      where: { id },
      data: {
        players: {
          delete: { id: playerId },
        },
      },
    });
  }

  public async findAllPlayers(id: number): Promise<PlayerEntity[]> {
    return this.playersService.findAllByMatchId(id);
  }

  public async publish(id: number): Promise<any> {
    const match = await this.prismaService.match.findFirst({
      where: { id },
      include: {
        season: { include: { league: true } },
        players: true,
        teamReports: true,
      },
    });

    const [homeTeamData, awayTeamData] = await Promise.all([
      this.getDataFromCsv(match.homeTeamCsv),
      this.getDataFromCsv(match.awayTeamCsv),
    ]);

    const resultProperties = await this.prismaService.resultProperty.findMany({
      where: {
        type: 'PLAYER',
        parentId: null,
      },
      include: { children: true },
    });

    await this.prismaService.match.update({
      where: { id: match.id },
      data: { teamReports: { deleteMany: {} } },
    });

    const allProperties = _.transform<
      ResultProperty & { children: ResultProperty[] },
      { [n: string]: { [k: string]: number } }
    >(
      resultProperties,
      (results, rp) => {
        _.assign(results, {
          [rp.alias]: _.transform(
            rp.children,
            (r, v) => {
              _.assign(r, { [v.alias]: 0 });
            },
            {},
          ),
        });
      },
      {},
    );

    const [homeTeamStats, awayTeamStats] = _.map(
      [homeTeamData.stats, awayTeamData.stats],
      (stats, i) => {
        return _.transform<
          CSVProperty,
          { [id: string]: { [p: string]: CSVProperty } }
        >(
          stats,
          (results, v, k) => {
            const player = _.find(
              match.players,
              (p) => p.playerNumber === _.toNumber(k),
            );

            const {
              DISPOSAL_STATISTICS,
              CLEARANCES,
              POSSESSIONS_MARKING,
              OTHER,
            } = _.merge(_.cloneDeep(allProperties), {
              DISPOSAL_STATISTICS: {
                D: 0,
                E_1: 0,
                IE_1: 0,
                TO_1: 0,
                PER_1: 0,
                K: 0,
                E_2: 0,
                IE_2: 0,
                TO_2: 0,
                PER_2: 0,
                HB: 0,
                E_3: 0,
                IE_3: 0,
                TO_3: 0,
                PER_3: 0,
              },
              CLEARANCES: {
                CLR_BU: 0,
                CLR_CSB: 0,
                CLR_TI: 0,
                CLR: 0,
              },
              POSSESSIONS_MARKING: {
                CP: 0,
                UP: 0,
                CM: 0,
                UM: 0,
                F50M: 0,
                INTM: 0,
              },
              OTHER: {
                HO: 0,
                HOTA: 0,
                T: 0,
                FK_F: 0,
                FK_A: 0,
                I50: 0,
                G: 0,
                B: 0,
              },
            });

            // ### `DISPOSAL_STATISTICS`
            // ## `D`
            DISPOSAL_STATISTICS.E_1 = _.add(v.KICK_EF, v.HB_EF);
            DISPOSAL_STATISTICS.IE_1 = _.add(v.KICK_IE, v.HB_IE);
            DISPOSAL_STATISTICS.TO_1 = _.add(v.KICK_TO, v.HB_TO);
            DISPOSAL_STATISTICS.D = _.sum([
              DISPOSAL_STATISTICS.E_1,
              DISPOSAL_STATISTICS.IE_1,
              DISPOSAL_STATISTICS.TO_1,
            ]);
            DISPOSAL_STATISTICS.PER_1 = _.round(
              _.divide(DISPOSAL_STATISTICS.E_1, DISPOSAL_STATISTICS.D),
              3,
            );

            // ## `E`
            DISPOSAL_STATISTICS.E_2 = v.KICK_EF;
            DISPOSAL_STATISTICS.IE_2 = v.KICK_IE;
            DISPOSAL_STATISTICS.TO_2 = v.KICK_TO;
            DISPOSAL_STATISTICS.K = _.sum([
              DISPOSAL_STATISTICS.E_2,
              DISPOSAL_STATISTICS.IE_2,
              DISPOSAL_STATISTICS.TO_2,
            ]);
            DISPOSAL_STATISTICS.PER_2 = _.round(
              _.divide(DISPOSAL_STATISTICS.E_2, DISPOSAL_STATISTICS.K),
              3,
            );

            // ## `HB`
            DISPOSAL_STATISTICS.E_3 = v.HB_EF;
            DISPOSAL_STATISTICS.IE_3 = v.HB_IE;
            DISPOSAL_STATISTICS.TO_3 = v.HB_TO;
            DISPOSAL_STATISTICS.HB = _.sum([
              DISPOSAL_STATISTICS.E_3,
              DISPOSAL_STATISTICS.IE_3,
              DISPOSAL_STATISTICS.TO_3,
            ]);
            DISPOSAL_STATISTICS.PER_3 = _.round(
              _.divide(DISPOSAL_STATISTICS.E_3, DISPOSAL_STATISTICS.HB),
              3,
            );

            // ### `CLEARANCES`
            CLEARANCES.CLR_BU = v.CLR_BU;
            CLEARANCES.CLR_CSB = v.CLR_CSB;
            CLEARANCES.CLR_TI = v.CLR_TI;
            CLEARANCES.CLR = _.sum([v.CLR_BU, v.CLR_CSB, v.CLR_TI]);

            // ### `POSSESSIONS_MARKING`
            POSSESSIONS_MARKING.CP = v.POSS_CONT;
            POSSESSIONS_MARKING.UP = v.POSS_UNCON;
            POSSESSIONS_MARKING.CM = v.MARK_CONT;
            POSSESSIONS_MARKING.UM = v.MARK_UC;
            POSSESSIONS_MARKING.F50M = v.MARK_F50;
            POSSESSIONS_MARKING.INTM = v.MARK_INT;

            // ### `OTHER`
            OTHER.HO = v.RUCK_HO;
            // OTHER.HOTA = 0; ????
            OTHER.T = v.TACKLE_EF;
            OTHER.FK_F = v.FK_FOR;
            OTHER.FK_A = v.FK_AGAINST;
            OTHER.I50 = v.I50_INDIVIDUAL;
            OTHER.G = i === 0 ? v.GOAL_HOME : v.GOAL_AWAY;
            OTHER.B = i === 0 ? v.BEHIND_HOME : v.BEHIND_AWAY;

            _.assign(results, {
              [player.id.toString()]: _.merge(_.cloneDeep(allProperties), {
                DISPOSAL_STATISTICS,
                CLEARANCES,
                POSSESSIONS_MARKING,
                OTHER,
              }),
            });
          },
          {},
        );
      },
    );

    const [homeTeamReport, awayTeamReport] = await Promise.all([
      this.prismaService.teamReport.create({
        data: {
          matchId: match.id,
          teamId: match.homeTeamId,
          score: 0,
          meta: homeTeamData.meta,
          playersOnTeamReports: {
            createMany: {
              data: _.transform(
                homeTeamStats,
                (results, stats, id) => {
                  _.forEach(stats, (children) => {
                    _.forEach(children, (v, k) => {
                      const resultProperty = _(resultProperties)
                        .transform((r, p) => {
                          _.forEach(p.children, (c) => {
                            r.push(c);
                          });
                        }, [])
                        .find((p) => p.alias === k) as ResultProperty;

                      results.push({
                        playerId: _.toNumber(id),
                        resultPropertyId: resultProperty.id,
                        value: v || 0,
                      });
                    });
                  });
                },
                [],
              ),
            },
          },
        },
      }),
      this.prismaService.teamReport.create({
        data: {
          matchId: match.id,
          teamId: match.awayTeamId,
          score: 0,
          meta: homeTeamData.meta,
          playersOnTeamReports: {
            createMany: {
              data: _.transform(
                awayTeamStats,
                (results, stats, id) => {
                  _.forEach(stats, (children) => {
                    _.forEach(children, (v, k) => {
                      const resultProperty = _(resultProperties)
                        .transform((r, p) => {
                          _.forEach(p.children, (c) => {
                            r.push(c);
                          });
                        }, [])
                        .find((p) => p.alias === k) as ResultProperty;

                      results.push({
                        playerId: _.toNumber(id),
                        resultPropertyId: resultProperty.id,
                        value: v || 0,
                      });
                    });
                  });
                },
                [],
              ),
            },
          },
        },
      }),
    ]);

    console.log(homeTeamReport.id, awayTeamReport.id);

    this.logger.debug(`Publish report of match #${match.id} successful.`);
  }

  public async getStats(id: number): Promise<{
    reports: any;
    teamReports: any;
    leaders: any;
  }> {
    const match = await this.prismaService.match.findFirst({
      where: { id },
      include: {
        reportsOnMatches: {
          include: {
            resultProperty: {
              include: { parent: true },
            },
          },
        },
        teamReports: {
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
        },
      },
    });

    const reports = _(match.reportsOnMatches)
      .groupBy((report) => report.resultProperty.parent.name)
      .mapValues((reports) => {
        return _(reports)
          .transform((results, r) => {
            _.assign(results, {
              [r.resultProperty.name]: _(r.value)
                .transform((s, n, i) => {
                  switch (i) {
                    case 1:
                      _.assign(s, { away: n });
                      break;
                    case 2:
                      _.assign(s, { diff: n });
                      break;
                    default:
                      _.assign(s, { home: n });
                      break;
                  }
                }, {})
                .value(),
            });
          }, {})
          .value();
      })
      .value();

    const teamReports = _(match.teamReports)
      .map((teamReport) => ({
        // ...teamReport,
        team: _.pick(teamReport.team, ['id', 'name', 'logo']),
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
              player: _.pick(player, ['id', 'name']),
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
      }))
      .transform((results, value) => {
        if (value.team.id === match.homeTeamId) {
          _.assign(results, { home: value });
        } else {
          _.assign(results, { away: value });
        }
      }, {})
      .value();

    const leaders = _(match.teamReports)
      .map((teamReport) => ({
        teamId: teamReport.teamId,
        reports: _(teamReport.playersOnTeamReports)
          .groupBy((p) => p.resultProperty.alias)
          .mapValues((p) => {
            return _(p)
              .map((r) => {
                return {
                  name: r.resultProperty.name,
                  player: _.pick(r.player, ['id', 'name']),
                  value: r.value,
                };
              })
              .orderBy((r) => r.value, 'desc')
              .take(4)
              .value();
          })
          .value(),
      }))
      .transform((results, value) => {
        if (value.teamId === match.homeTeamId) {
          _.assign(results, { home: value });
        } else {
          _.assign(results, { away: value });
        }
      }, {})
      .value();

    return { reports, teamReports, leaders };
  }

  private async getDataFromCsv(filePath: string): Promise<{
    meta: { [n: 'RUSHED' | string]: number };
    stats: { [n: number]: CSVProperty };
  }> {
    const buffer = await this.readCsvFromS3('csv', filePath);

    const headers = [];
    const rows = _.transform<any, { [n: string]: CSVProperty }>(
      parse(buffer, { skip_empty_lines: true }),
      (results, row, i) => {
        const [k, ...args] = row as string[];

        if (i === 0) {
          headers.push(..._.map(args, (s) => s.replace(/[:|\s+]/g, '_')));
        }

        if (!/[a-zA-Z\s]RUSHED/.test(k) && !/[A|H][0-9]{1,2}/.test(k)) {
          return;
        }

        _.assign(results, {
          [k.trim()]: _(args)
            .map((s) => _.toNumber(s))
            .map((n) => (!_.isNaN(n) ? n : 0))
            .transform((r, v, i) => {
              const h = _.get(headers, i);

              if (_.isNil(h)) {
                return;
              }

              _.assign(r, { [h]: v || 0 });
            }, {})
            .value(),
        });
      },
      {},
    );

    const meta = { RUSHED: 0 };

    const stats = _(rows)
      .transform<{ [n: string]: CSVProperty }>((result, args, key) => {
        if (!/[a-zA-Z\s]RUSHED/.test(key) && !/[A|H][0-9]{1,2}/.test(key)) {
          return;
        }

        if (/[a-zA-Z\s]RUSHED/.test(key)) {
          meta.RUSHED = args[0];

          return;
        }

        key = key.replace(/[A|H]([0-9]{1,2}).*/, '$1');

        _.assign(result, { [key]: args });
      }, {})
      .value();

    return { meta, stats };
  }

  private async uploadCsvToS3(
    bucket: string,
    filePath: string,
    oldKey?: string,
  ): Promise<string> {
    if (!_.isNil(oldKey)) {
      await this.s3.deleteObject({ Bucket: bucket, Key: oldKey }).promise();
    }

    const buffer = readFileSync(filePath);

    const data = await this.s3
      .upload({
        Bucket: bucket,
        Key: `${uuid()}.csv`,
        Body: buffer,
      })
      .promise();

    unlinkSync(filePath);

    return data.Key;
  }

  private async readCsvFromS3(bucket: string, key: string): Promise<Buffer> {
    const { Body } = await this.s3
      .getObject({ Bucket: bucket, Key: key })
      .promise();

    return Buffer.from(Body as Buffer);
  }
}
