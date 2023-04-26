import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MatchStatus,
  PlayersOnTeamReports,
  ResultProperty,
  TeamReport,
} from '@prisma/client';
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
import { CSVProperty, PlayerStatsProperty } from './matches.types';

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
    const match = await this.prismaService.match.findFirst({
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

    return _.merge(match, {
      isCanPublish: this._getIsCanPublish(match),
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
      homeTeamCsv = await this._uploadCsvToS3('csv', homeTeamCsv);
    }

    if (!_.isNil(awayTeamCsv)) {
      awayTeamCsv = await this._uploadCsvToS3('csv', awayTeamCsv);
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
      throw new BadRequestException('This match could not be published.');
    }

    if (!_.isNil(homeTeamCsv)) {
      homeTeamCsv = await this._uploadCsvToS3(
        'csv',
        homeTeamCsv,
        match.homeTeamCsv,
      );
    }

    if (!_.isNil(awayTeamCsv)) {
      awayTeamCsv = await this._uploadCsvToS3(
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

  private _getIsCanPublish(match: MatchEntity): boolean {
    return !_([
      match.type,
      match.seasonId,
      match.homeTeamId,
      match.homeTeamCsv,
      match.awayTeamId,
      match.awayTeamCsv,
      match.round,
      match.date,
      match.locationId,
    ]).some((v) => _.isNil(v));
  }

  public async publish(id: number): Promise<any> {
    const match = await this.prismaService.match.findFirst({
      where: {
        id,
        status: 'DRAFT',
      },
      include: {
        season: { include: { league: true } },
        players: { include: { player: true } },
        teamReports: true,
      },
    });

    if (_.isNil(match)) {
      throw new NotFoundException();
    }

    if (!this._getIsCanPublish(match)) {
      throw new BadRequestException();
    }

    const [homeTeamData, awayTeamData] = await Promise.all([
      this._getDataFromCsv(match.homeTeamCsv),
      this._getDataFromCsv(match.awayTeamCsv),
    ]);

    await this.prismaService.match.update({
      where: { id: match.id },
      data: {
        reportsOnMatches: { deleteMany: {} },
        teamReports: { deleteMany: {} },
      },
    });

    let homeTeamReport: TeamReport & {
      playersOnTeamReports: (PlayersOnTeamReports & {
        resultProperty: ResultProperty;
      })[];
    };
    let awayTeamReport: TeamReport & {
      playersOnTeamReports: (PlayersOnTeamReports & {
        resultProperty: ResultProperty;
      })[];
    };

    {
      const resultProperties = await this.prismaService.resultProperty.findMany(
        {
          where: {
            type: 'PLAYER',
            parentId: null,
          },
          include: { children: true },
        },
      );

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
              const teamId = i === 0 ? match.homeTeamId : match.awayTeamId;

              const player = _.find(
                match.players,
                (p) => p.teamId === teamId && p.playerNumber === _.toNumber(k),
              );

              if (_.isNil(player)) {
                throw new BadRequestException(
                  `Could not find a player whose number is ${k}.`,
                );
              }

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
                  // HOTA: 0,
                  T: 0,
                  FK_F: 0,
                  FK_A: 0,
                  I50: 0,
                  G: 0,
                  B: 0,
                  EFFORT_SPOIL: 0,
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
              if (DISPOSAL_STATISTICS.PER_1 > 0) {
                DISPOSAL_STATISTICS.PER_1 = _.round(
                  DISPOSAL_STATISTICS.PER_1 * 100,
                  1,
                );
              }

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
              if (DISPOSAL_STATISTICS.PER_2 > 0) {
                DISPOSAL_STATISTICS.PER_2 = _.round(
                  DISPOSAL_STATISTICS.PER_2 * 100,
                  1,
                );
              }

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
              if (DISPOSAL_STATISTICS.PER_3 > 0) {
                DISPOSAL_STATISTICS.PER_3 = _.round(
                  DISPOSAL_STATISTICS.PER_3 * 100,
                  1,
                );
              }

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
              OTHER.EFFORT_SPOIL = v.EFFORT_SPOIL;

              _.assign(results, {
                [player.playerId.toString()]: _.merge(
                  _.cloneDeep(allProperties),
                  {
                    DISPOSAL_STATISTICS,
                    CLEARANCES,
                    POSSESSIONS_MARKING,
                    OTHER,
                  },
                ),
              });
            },
            {},
          );
        },
      );

      const sumByStats = (
        data: { [id: string]: { [p: string]: CSVProperty } },
        key: string,
      ) => {
        return _(data)
          .transform((r, v) => {
            r.push(_.get(v, key));
          }, [])
          .sum();
      };

      [homeTeamReport, awayTeamReport] = await Promise.all([
        this.prismaService.teamReport.create({
          data: {
            matchId: match.id,
            teamId: match.homeTeamId,
            score: _.sum([
              _.multiply(sumByStats(homeTeamStats, 'OTHER.G'), 6),
              sumByStats(homeTeamStats, 'OTHER.B'),
              homeTeamData.meta.RUSHED,
            ]),
            meta: _.merge(homeTeamData.meta, {
              TOTAL_GOAL: sumByStats(homeTeamStats, 'OTHER.G'),
              TOTAL_BEHIND: sumByStats(homeTeamStats, 'OTHER.B'),
            }),
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
          include: {
            playersOnTeamReports: {
              include: { resultProperty: true },
            },
          },
        }),
        this.prismaService.teamReport.create({
          data: {
            matchId: match.id,
            teamId: match.awayTeamId,
            score: _.sum([
              _.multiply(sumByStats(awayTeamStats, 'OTHER.G'), 6),
              sumByStats(awayTeamStats, 'OTHER.B'),
              awayTeamData.meta.RUSHED,
            ]),
            meta: _.merge(awayTeamData.meta, {
              TOTAL_GOAL: sumByStats(awayTeamStats, 'OTHER.G'),
              TOTAL_BEHIND: sumByStats(awayTeamStats, 'OTHER.B'),
            }),
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
          include: {
            playersOnTeamReports: {
              include: { resultProperty: true },
            },
          },
        }),
      ]);
    }

    {
      const homeTeamStats = _(homeTeamReport.playersOnTeamReports)
        .groupBy((p) => p.playerId)
        .mapValues((stats) => {
          return _.transform(
            stats,
            (r, v) => {
              _.assign(r, { [v.resultProperty.alias]: v.value });
            },
            {} as PlayerStatsProperty,
          );
        })
        .value();
      const awayTeamStats = _(awayTeamReport.playersOnTeamReports)
        .groupBy((p) => p.playerId)
        .mapValues((stats) => {
          return _.transform(
            stats,
            (r, v) => {
              _.assign(r, { [v.resultProperty.alias]: v.value });
            },
            {} as PlayerStatsProperty,
          );
        })
        .value();

      const resultProperties = await this.prismaService.resultProperty.findMany(
        {
          where: {
            type: 'MATCH',
            parentId: null,
          },
          include: { children: true },
        },
      );

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
                _.assign(r, { [v.alias]: [0, 0, 0] });
              },
              {},
            ),
          });
        },
        {},
      );

      const sumBy = (
        stats: { [n: string]: PlayerStatsProperty },
        k: keyof PlayerStatsProperty,
      ): number => _(stats).mapValues(k).values().sum();

      const { OVERVIEW, STOPPAGE, OFFENCE, POSSESSION } = _.merge(
        _.cloneDeep(allProperties),
        {
          OVERVIEW: {
            DISPOSAL: [0, 0, 0],
            KICKS: [0, 0, 0],
            HANDBALLS: [0, 0, 0],
            KH_RATIO: [0, 0, 0],
            DISPOSAL_PER: [0, 0, 0],
            CLANGERS: [0, 0, 0],
            I50S: [0, 0, 0],
            SC_PER_I50: [0, 0, 0],
            CONT_POSS: [0, 0, 0],
            UNCON_POSS: [0, 0, 0],
            MARK: [0, 0, 0],
            F50_MARKS: [0, 0, 0],
            UNCON_M: [0, 0, 0],
            CONT_M: [0, 0, 0],
            INTERCEPT_M: [0, 0, 0],
            TACKLES: [0, 0, 0],
            FREE_KICKS: [0, 0, 0],
            EFFORT_SPOIL: [0, 0, 0],
          },
          STOPPAGE: {
            BU: [0, 0, 0],
            CSB: [0, 0, 0],
            TI: [0, 0, 0],
            TOTAL_CLR: [0, 0, 0],
            HIT_OUTS: [0, 0, 0],
            // HIT_OUTS_TA: [0, 0, 0],
          },
          OFFENCE: {
            I50S: [0, 0, 0],
            SC_PER_I50: [0, 0, 0],
            // DEEP: [0, 0, 0],
            // SHALLOW: [0, 0, 0],
            F50_MARKS: [0, 0, 0],
            R_BEHINDS: [0, 0, 0],
          },
          POSSESSION: {
            // LOOSE_BALL: [0, 0, 0],
            // HARD_BALL: [0, 0, 0],
            FREES_FOR: [0, 0, 0],
            COUNT_M: [0, 0, 0],
            TOTAL_CONT: [0, 0, 0],
            HB_REC: [0, 0, 0],
            // GATHERS: [0, 0, 0],
            UNCON_M: [0, 0, 0],
            TOTAL_UNCON: [0, 0, 0],
          },
        },
      );

      // ## `OVERVIEW`

      OVERVIEW.DISPOSAL[0] = sumBy(homeTeamStats, 'D');
      OVERVIEW.DISPOSAL[1] = sumBy(awayTeamStats, 'D');
      OVERVIEW.DISPOSAL[2] = _.subtract(
        OVERVIEW.DISPOSAL[0],
        OVERVIEW.DISPOSAL[1],
      );

      OVERVIEW.KICKS[0] = sumBy(homeTeamStats, 'K');
      OVERVIEW.KICKS[1] = sumBy(awayTeamStats, 'K');
      OVERVIEW.KICKS[2] = _.subtract(OVERVIEW.KICKS[0], OVERVIEW.KICKS[1]);

      OVERVIEW.HANDBALLS[0] = sumBy(homeTeamStats, 'HB');
      OVERVIEW.HANDBALLS[1] = sumBy(awayTeamStats, 'HB');
      OVERVIEW.HANDBALLS[2] = _.subtract(
        OVERVIEW.HANDBALLS[0],
        OVERVIEW.HANDBALLS[1],
      );

      OVERVIEW.KH_RATIO[0] = _.round(
        _.divide(OVERVIEW.KICKS[0], OVERVIEW.HANDBALLS[0]),
        2,
      );
      OVERVIEW.KH_RATIO[1] = _.round(
        _.divide(OVERVIEW.KICKS[1], OVERVIEW.HANDBALLS[1]),
        2,
      );
      OVERVIEW.KH_RATIO[2] = _.round(
        _.subtract(OVERVIEW.KH_RATIO[0], OVERVIEW.KH_RATIO[1]),
        2,
      );

      OVERVIEW.DISPOSAL_PER[0] = _.round(
        _.divide(sumBy(homeTeamStats, 'E_1'), sumBy(homeTeamStats, 'D')) * 100,
        1,
      );
      OVERVIEW.DISPOSAL_PER[1] = _.round(
        _.divide(sumBy(awayTeamStats, 'E_1'), sumBy(awayTeamStats, 'D')) * 100,
        1,
      );
      OVERVIEW.DISPOSAL_PER[2] = _.round(
        _.subtract(OVERVIEW.DISPOSAL_PER[0], OVERVIEW.DISPOSAL_PER[1]),
        1,
      );

      OVERVIEW.CLANGERS[0] = sumBy(homeTeamStats, 'TO_1');
      OVERVIEW.CLANGERS[1] = sumBy(awayTeamStats, 'TO_1');
      OVERVIEW.CLANGERS[2] = _.subtract(
        OVERVIEW.CLANGERS[0],
        OVERVIEW.CLANGERS[1],
      );

      OVERVIEW.I50S[0] = sumBy(homeTeamStats, 'I50');
      OVERVIEW.I50S[1] = sumBy(awayTeamStats, 'I50');
      OVERVIEW.I50S[2] = _.subtract(OVERVIEW.I50S[0], OVERVIEW.I50S[1]);

      OVERVIEW.SC_PER_I50[0] = _.round(
        _.divide(
          _.sum([
            homeTeamData.meta.RUSHED || 0,
            sumBy(homeTeamStats, 'G'),
            sumBy(homeTeamStats, 'B'),
          ]),
          OVERVIEW.I50S[0],
        ) * 100,
        1,
      );
      OVERVIEW.SC_PER_I50[1] = _.round(
        _.divide(
          _.sum([
            awayTeamData.meta.RUSHED || 0,
            sumBy(awayTeamStats, 'G'),
            sumBy(awayTeamStats, 'B'),
          ]),
          OVERVIEW.I50S[1],
        ) * 100,
        1,
      );
      OVERVIEW.SC_PER_I50[2] = _.round(
        _.subtract(OVERVIEW.SC_PER_I50[0], OVERVIEW.SC_PER_I50[1]),
        1,
      );

      OVERVIEW.CONT_POSS[0] = sumBy(homeTeamStats, 'CP');
      OVERVIEW.CONT_POSS[1] = sumBy(awayTeamStats, 'CP');
      OVERVIEW.CONT_POSS[2] = _.subtract(
        OVERVIEW.CONT_POSS[0],
        OVERVIEW.CONT_POSS[1],
      );

      OVERVIEW.UNCON_POSS[0] = sumBy(homeTeamStats, 'UP');
      OVERVIEW.UNCON_POSS[1] = sumBy(awayTeamStats, 'UP');
      OVERVIEW.UNCON_POSS[2] = _.subtract(
        OVERVIEW.UNCON_POSS[0],
        OVERVIEW.UNCON_POSS[1],
      );

      OVERVIEW.MARK[0] = _.add(
        sumBy(homeTeamStats, 'CM'),
        sumBy(homeTeamStats, 'UM'),
      );
      OVERVIEW.MARK[1] = _.add(
        sumBy(awayTeamStats, 'CM'),
        sumBy(awayTeamStats, 'UM'),
      );
      OVERVIEW.MARK[2] = _.subtract(OVERVIEW.MARK[0], OVERVIEW.MARK[1]);

      OVERVIEW.F50_MARKS[0] = sumBy(homeTeamStats, 'F50M');
      OVERVIEW.F50_MARKS[1] = sumBy(awayTeamStats, 'F50M');
      OVERVIEW.F50_MARKS[2] = _.subtract(
        OVERVIEW.F50_MARKS[0],
        OVERVIEW.F50_MARKS[1],
      );

      OVERVIEW.UNCON_M[0] = sumBy(homeTeamStats, 'UM');
      OVERVIEW.UNCON_M[1] = sumBy(awayTeamStats, 'UM');
      OVERVIEW.UNCON_M[2] = _.subtract(
        OVERVIEW.UNCON_M[0],
        OVERVIEW.UNCON_M[1],
      );

      OVERVIEW.CONT_M[0] = sumBy(homeTeamStats, 'CM');
      OVERVIEW.CONT_M[1] = sumBy(awayTeamStats, 'CM');
      OVERVIEW.CONT_M[2] = _.subtract(OVERVIEW.CONT_M[0], OVERVIEW.CONT_M[1]);

      OVERVIEW.INTERCEPT_M[0] = sumBy(homeTeamStats, 'INTM');
      OVERVIEW.INTERCEPT_M[1] = sumBy(awayTeamStats, 'INTM');
      OVERVIEW.INTERCEPT_M[2] = _.subtract(
        OVERVIEW.INTERCEPT_M[0],
        OVERVIEW.INTERCEPT_M[1],
      );

      OVERVIEW.TACKLES[0] = sumBy(homeTeamStats, 'T');
      OVERVIEW.TACKLES[1] = sumBy(awayTeamStats, 'T');
      OVERVIEW.TACKLES[2] = _.subtract(
        OVERVIEW.TACKLES[0],
        OVERVIEW.TACKLES[1],
      );

      OVERVIEW.FREE_KICKS[0] = sumBy(homeTeamStats, 'FK_F');
      OVERVIEW.FREE_KICKS[1] = sumBy(awayTeamStats, 'FK_F');
      OVERVIEW.FREE_KICKS[2] = _.subtract(
        OVERVIEW.FREE_KICKS[0],
        OVERVIEW.FREE_KICKS[1],
      );

      OVERVIEW.EFFORT_SPOIL[0] = sumBy(homeTeamStats, 'EFFORT_SPOIL');
      OVERVIEW.EFFORT_SPOIL[1] = sumBy(awayTeamStats, 'EFFORT_SPOIL');
      OVERVIEW.EFFORT_SPOIL[2] = _.subtract(
        OVERVIEW.EFFORT_SPOIL[0],
        OVERVIEW.EFFORT_SPOIL[1],
      );

      // ## `STOPPAGE`

      STOPPAGE.BU[0] = sumBy(homeTeamStats, 'CLR_BU');
      STOPPAGE.BU[1] = sumBy(awayTeamStats, 'CLR_BU');
      STOPPAGE.BU[2] = _.subtract(STOPPAGE.BU[0], STOPPAGE.BU[1]);

      STOPPAGE.CSB[0] = sumBy(homeTeamStats, 'CLR_CSB');
      STOPPAGE.CSB[1] = sumBy(awayTeamStats, 'CLR_CSB');
      STOPPAGE.CSB[2] = _.subtract(STOPPAGE.CSB[0], STOPPAGE.CSB[1]);

      STOPPAGE.TI[0] = sumBy(homeTeamStats, 'CLR_TI');
      STOPPAGE.TI[1] = sumBy(awayTeamStats, 'CLR_TI');
      STOPPAGE.TI[2] = _.subtract(STOPPAGE.TI[0], STOPPAGE.TI[1]);

      STOPPAGE.TOTAL_CLR[0] = sumBy(homeTeamStats, 'CLR');
      STOPPAGE.TOTAL_CLR[1] = sumBy(awayTeamStats, 'CLR');
      STOPPAGE.TOTAL_CLR[2] = _.subtract(
        STOPPAGE.TOTAL_CLR[0],
        STOPPAGE.TOTAL_CLR[1],
      );

      STOPPAGE.HIT_OUTS[0] = sumBy(homeTeamStats, 'HO');
      STOPPAGE.HIT_OUTS[1] = sumBy(awayTeamStats, 'HO');
      STOPPAGE.HIT_OUTS[2] = _.subtract(
        STOPPAGE.HIT_OUTS[0],
        STOPPAGE.HIT_OUTS[1],
      );

      // STOPPAGE.HIT_OUTS_TA[0] = sumBy(homeTeamStats, 'HOTA');
      // STOPPAGE.HIT_OUTS_TA[1] = sumBy(awayTeamStats, 'HOTA');
      // STOPPAGE.HIT_OUTS_TA[2] = _.subtract(
      //   STOPPAGE.HIT_OUTS_TA[0],
      //   STOPPAGE.HIT_OUTS_TA[1],
      // );

      // ## `OFFENCE`

      OFFENCE.I50S[0] = OVERVIEW.I50S[0];
      OFFENCE.I50S[1] = OVERVIEW.I50S[1];
      OFFENCE.I50S[2] = OVERVIEW.I50S[2];

      OFFENCE.SC_PER_I50[0] = OVERVIEW.SC_PER_I50[0];
      OFFENCE.SC_PER_I50[1] = OVERVIEW.SC_PER_I50[1];
      OFFENCE.SC_PER_I50[2] = OVERVIEW.SC_PER_I50[2];

      // OFFENCE.DEEP[0] = 0;
      // OFFENCE.DEEP[1] = 0;
      // OFFENCE.DEEP[2] = _.subtract(OFFENCE.DEEP[0], OFFENCE.DEEP[1]);

      // OFFENCE.SHALLOW[0] = 0;
      // OFFENCE.SHALLOW[1] = 0;
      // OFFENCE.SHALLOW[2] = _.subtract(OFFENCE.SHALLOW[0], OFFENCE.SHALLOW[1]);

      OFFENCE.F50_MARKS[0] = OVERVIEW.F50_MARKS[0];
      OFFENCE.F50_MARKS[1] = OVERVIEW.F50_MARKS[1];
      OFFENCE.F50_MARKS[2] = OVERVIEW.F50_MARKS[2];

      OFFENCE.R_BEHINDS[0] = homeTeamData.meta.RUSHED || 0;
      OFFENCE.R_BEHINDS[1] = awayTeamData.meta.RUSHED || 0;
      OFFENCE.R_BEHINDS[2] = 0;

      // ## `POSSESSION`

      // POSSESSION.LOOSE_BALL[0] = 0;
      // POSSESSION.LOOSE_BALL[1] = 0;
      // POSSESSION.LOOSE_BALL[2] = _.subtract(
      //   POSSESSION.LOOSE_BALL[0],
      //   POSSESSION.LOOSE_BALL[1],
      // );

      // POSSESSION.HARD_BALL[0] = 0;
      // POSSESSION.HARD_BALL[1] = 0;
      // POSSESSION.HARD_BALL[2] = _.subtract(
      //   POSSESSION.HARD_BALL[0],
      //   POSSESSION.HARD_BALL[1],
      // );

      POSSESSION.FREES_FOR[0] = sumBy(homeTeamStats, 'FK_F');
      POSSESSION.FREES_FOR[1] = sumBy(awayTeamStats, 'FK_F');
      POSSESSION.FREES_FOR[2] = _.subtract(
        POSSESSION.FREES_FOR[0],
        POSSESSION.FREES_FOR[1],
      );

      POSSESSION.COUNT_M[0] = sumBy(homeTeamStats, 'CM');
      POSSESSION.COUNT_M[1] = sumBy(awayTeamStats, 'CM');
      POSSESSION.COUNT_M[2] = _.subtract(
        POSSESSION.COUNT_M[0],
        POSSESSION.COUNT_M[1],
      );

      POSSESSION.TOTAL_CONT[0] = sumBy(homeTeamStats, 'CP');
      POSSESSION.TOTAL_CONT[1] = sumBy(awayTeamStats, 'CP');
      POSSESSION.TOTAL_CONT[2] = _.subtract(
        POSSESSION.TOTAL_CONT[0],
        POSSESSION.TOTAL_CONT[1],
      );

      POSSESSION.HB_REC[0] = sumBy(homeTeamStats, 'E_3');
      POSSESSION.HB_REC[1] = sumBy(awayTeamStats, 'E_3');
      POSSESSION.HB_REC[2] = _.subtract(
        POSSESSION.HB_REC[0],
        POSSESSION.HB_REC[1],
      );

      // POSSESSION.GATHERS[0] = 0;
      // POSSESSION.GATHERS[1] = 0;
      // POSSESSION.GATHERS[2] = _.subtract(
      //   POSSESSION.GATHERS[0],
      //   POSSESSION.GATHERS[1],
      // );

      POSSESSION.UNCON_M[0] = sumBy(homeTeamStats, 'UM');
      POSSESSION.UNCON_M[1] = sumBy(awayTeamStats, 'UM');
      POSSESSION.UNCON_M[2] = _.subtract(
        POSSESSION.UNCON_M[0],
        POSSESSION.UNCON_M[1],
      );

      POSSESSION.TOTAL_UNCON[0] = sumBy(homeTeamStats, 'UP');
      POSSESSION.TOTAL_UNCON[1] = sumBy(awayTeamStats, 'UP');
      POSSESSION.TOTAL_UNCON[2] = _.subtract(
        POSSESSION.TOTAL_UNCON[0],
        POSSESSION.TOTAL_UNCON[1],
      );

      await this.prismaService.match.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          reportsOnMatches: {
            createMany: {
              data: _.transform(
                _.merge(_.cloneDeep(allProperties), {
                  OVERVIEW,
                  STOPPAGE,
                  OFFENCE,
                  POSSESSION,
                }),
                (results, report) => {
                  _(report)
                    .keys()
                    .each((k) => {
                      const resultProperty = _(resultProperties)
                        .transform((r, p) => {
                          _.forEach(p.children, (c) => {
                            r.push(c);
                          });
                        }, [])
                        .find((p) => p.alias === k) as ResultProperty;

                      const value = _.get(report, k) as number[];

                      results.push({
                        resultPropertyId: resultProperty.id,
                        value: _.map(value, (v) => v || 0),
                      });
                    });
                },
                [],
              ),
            },
          },
        },
      });
    }

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
              player: _.pick(player, ['id', 'name', 'playerNumber']),
              values: _(values)
                .map((r) => ({
                  resultProperty: r.resultProperty,
                  value: r.value,
                }))
                .orderBy(['resultProperty.priority', 'resultProperty.id'])
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
                  player: _.pick(r.player, ['id', 'name', 'playerNumber']),
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

  private async _getDataFromCsv(filePath: string): Promise<{
    meta: { RUSHED: number }; // TeamReportEntity['meta'];
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

        const key = k.trim();

        if (!/[a-zA-Z\s]RUSHED/.test(key) && !/[A|H][0-9]{1,2}$/.test(key)) {
          return;
        }

        _.assign(results, {
          [key]: _(args)
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
        if (!/[a-zA-Z\s]RUSHED/.test(key) && !/[A|H][0-9]{1,2}$/.test(key)) {
          return;
        }

        if (/[a-zA-Z\s]RUSHED/.test(key)) {
          meta.RUSHED = _.values(args)[0];

          return;
        }

        key = key.replace(/[A|H]([0-9]{1,2}).*/, '$1');

        _.assign(result, { [key]: args });
      }, {})
      .value();

    return { meta, stats };
  }

  private async _uploadCsvToS3(
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
