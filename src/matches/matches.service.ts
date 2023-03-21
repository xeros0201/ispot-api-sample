import { Injectable, Logger } from '@nestjs/common';
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

type CSVProperty = {
  D?: number;
  E?: number;
  IE?: number;
  TO?: number;
  PER?: number;
  K?: number;
  KE?: number;
  K_IE?: number;
  K_TO?: number;
  K_PER?: number;
  HB?: number;
  HB_E?: number;
  HB_IE?: number;
  HB_TO?: number;
  HB_PER?: number;
  CLR_BU?: number;
  CLR_CSB?: number;
  CLR_TI?: number;
  CLR?: number;
  CP?: number;
  UP?: number;
  CM?: number;
  UM?: number;
  F50M?: number;
  INTM?: number;
  HO?: number;
  HOTA?: number;
  T?: number;
  FK_F?: number;
  FK_A?: number;
  I50?: number;
  G?: number;
  B?: number;
};

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
        aflResults: true,
      },
    });
  }

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
    [homeTeamCsv, awayTeamCsv] = await Promise.all([
      this.uploadCsvToS3('csv', homeTeamCsv),
      this.uploadCsvToS3('csv', awayTeamCsv),
    ]);

    const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
      this.playersService.findAllByTeamId(data.homeTeamId),
      this.playersService.findAllByTeamId(data.awayTeamId),
    ]);

    return this.prismaService.match.create({
      data: {
        ...data,
        homeTeamCsv,
        awayTeamCsv,
        players: {
          create: [
            ..._.map(homeTeamPlayers, (player) => ({
              playerId: player.id,
              teamId: player.teamId,
              playerNumber: player.playerNumber,
            })),
            ..._.map(awayTeamPlayers, (player) => ({
              playerId: player.id,
              teamId: player.teamId,
              playerNumber: player.playerNumber,
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

    homeTeamCsv = await this.uploadCsvToS3(
      'csv',
      homeTeamCsv,
      match.homeTeamCsv,
    );

    awayTeamCsv = await this.uploadCsvToS3(
      'csv',
      awayTeamCsv,
      match.awayTeamCsv,
    );

    const homePlayerIds = _(data.homePlayerIds)
      .transform<
        {
          playerNumber: number;
          playerId: PlayerEntity['id'];
        }[]
      >((result, value, key) => {
        result.push({
          playerNumber: +key.substring(1),
          playerId: +value,
        });
      }, [])
      .value();
    const awayPlayerIds = _(data.awayPlayerIds)
      .transform<
        {
          playerNumber: number;
          playerId: PlayerEntity['id'];
        }[]
      >((result, value, key) => {
        result.push({
          playerNumber: +key.substring(1),
          playerId: +value,
        });
      }, [])
      .value();

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
          deleteMany: {
            teamId: {
              in: [data.homeTeamId, data.awayTeamId],
            },
          },
          create: [
            ..._.map(homeTeamPlayers, (player) => {
              const { playerNumber } = _.find(
                homePlayerIds,
                (s) => s.playerId === player.id,
              ) || { playerNumber: player.playerNumber };

              return {
                playerId: player.id,
                teamId: player.teamId,
                playerNumber,
              };
            }),
            ..._.map(awayTeamPlayers, (player) => {
              const { playerNumber } = _.find(
                awayPlayerIds,
                (s) => s.playerId === player.id,
              ) || { playerNumber: player.playerNumber };

              return {
                playerId: player.id,
                teamId: player.teamId,
                playerNumber,
              };
            }),
          ],
        },
      },
    });
  }

  public async delete(id: number): Promise<MatchEntity> {
    return this.prismaService.match.delete({ where: { id } });
  }

  public async publish(id: number): Promise<void> {
    const match = await this.prismaService.match.findFirst({
      where: { id },
      include: {
        players: true,
        aflResults: true,
      },
    });

    const properties = await this.prismaService.aFLResultProperty.findMany({
      where: {
        parentId: { not: null },
      },
    });

    const [homeTeamStats, awayTeamStats] = await Promise.all([
      this.getStatsFromCsv(match.homeTeamCsv, 'HOME'),
      this.getStatsFromCsv(match.awayTeamCsv, 'AWAY'),
    ]);

    const [homeTeamAFLResult, awayTeamAFLResult] = await Promise.all([
      this.prismaService.aFLResult.findFirst({
        where: {
          matchId: match.id,
          teamId: match.homeTeamId,
        },
      }),
      this.prismaService.aFLResult.findFirst({
        where: {
          matchId: match.id,
          teamId: match.awayTeamId,
        },
      }),
    ]);

    await Promise.all([
      this.prismaService.reportsOnMatches.deleteMany({
        where: {
          matchId: match.id,
        },
      }),
      this.prismaService.playersOnAFLResults.deleteMany({
        where: {
          aflResultId: {
            in: [homeTeamAFLResult.id, awayTeamAFLResult.id],
          },
        },
      }),
    ]);

    await Promise.all([
      ..._(homeTeamStats)
        .keys()
        .map(async (key) => {
          const player = _.find(match.players, {
            teamId: match.homeTeamId,
            playerNumber: +key.substring(1),
          });

          if (_.isNil(player)) {
            return;
          }

          const stats = _.get(homeTeamStats, key);

          await this.prismaService.playersOnAFLResults.createMany({
            data: _(stats)
              .keys()
              .map((k) => {
                const property = _.find(properties, {
                  alias: k,
                  type: 'PLAYER',
                });

                if (_.isNil(property)) {
                  throw new Error('AFL Result Property not found!');
                }

                return {
                  aflResultId: homeTeamAFLResult.id,
                  aflResultPropertyId: property.id,
                  playerId: player.id,
                  value: _.get(stats, k),
                };
              })
              .value(),
          });
        })
        .value(),
      ..._(awayTeamStats)
        .keys()
        .map(async (key) => {
          const player = _.find(match.players, {
            teamId: match.awayTeamId,
            playerNumber: +key.substring(1),
          });

          if (_.isNil(player)) {
            return;
          }

          const stats = _.get(awayTeamStats, key);

          await this.prismaService.playersOnAFLResults.createMany({
            data: _(stats)
              .keys()
              .map((k) => {
                const property = _.find(properties, {
                  alias: k,
                  type: 'PLAYER',
                });

                if (_.isNil(property)) {
                  throw new Error('AFL Result Property not found!');
                }

                return {
                  aflResultId: awayTeamAFLResult.id,
                  aflResultPropertyId: property.id,
                  playerId: player.id,
                  value: _.get(stats, k),
                };
              })
              .value(),
          });
        })
        .value(),
    ]);

    // Overview: [Home, Away, Diff]
    const ov: {
      D: [number, number, number];
      K: [number, number, number];
      HB: [number, number, number];
      KH: [number, number, number];
      D_PER: [number, number, number];
      CL: [number, number, number];
      I50: [number, number, number];
      SC_PER: [number, number, number];
      CONT_POSS: [number, number, number];
      UNCON_POSS: [number, number, number];
      M: [number, number, number];
      F50_M: [number, number, number];
      UCM: [number, number, number];
      CM: [number, number, number];
      IM: [number, number, number];
      T: [number, number, number];
      FK: [number, number, number];
    } = {
      D: [0, 0, 0],
      K: [0, 0, 0],
      HB: [0, 0, 0],
      KH: [0, 0, 0],
      D_PER: [0, 0, 0],
      CL: [0, 0, 0],
      I50: [0, 0, 0],
      SC_PER: [0, 0, 0],
      CONT_POSS: [0, 0, 0],
      UNCON_POSS: [0, 0, 0],
      M: [0, 0, 0],
      F50_M: [0, 0, 0],
      UCM: [0, 0, 0],
      CM: [0, 0, 0],
      IM: [0, 0, 0],
      T: [0, 0, 0],
      FK: [0, 0, 0],
    };

    ov.D[0] = _(homeTeamStats)
      .mapValues((s) => s.D)
      .values()
      .sum();
    ov.D[1] = _(awayTeamStats)
      .mapValues((s) => s.D)
      .values()
      .sum();
    ov.D[2] = ov.D[0] - ov.D[1];

    ov.K[0] = _(homeTeamStats)
      .mapValues((s) => s.K)
      .values()
      .sum();
    ov.K[1] = _(awayTeamStats)
      .mapValues((s) => s.K)
      .values()
      .sum();
    ov.K[2] = ov.K[0] - ov.K[1];

    ov.HB[0] = _(homeTeamStats)
      .mapValues((s) => s.HB)
      .values()
      .sum();
    ov.HB[1] = _(awayTeamStats)
      .mapValues((s) => s.HB)
      .values()
      .sum();
    ov.HB[2] = ov.HB[0] - ov.HB[1];

    ov.KH[0] = _.round(ov.K[0] / ov.HB[0], 2);
    ov.KH[1] = _.round(ov.K[1] / ov.HB[1], 2);
    ov.KH[2] = _.round(ov.KH[0] - ov.KH[1], 2);

    const HOME_TOTAL_E = _(homeTeamStats)
      .mapValues((s) => s.E)
      .values()
      .sum();
    const HOME_TOTAL_D = _(homeTeamStats)
      .mapValues((s) => s.D)
      .values()
      .sum();
    const AWAY_TOTAL_E = _(awayTeamStats)
      .mapValues((s) => s.E)
      .values()
      .sum();
    const AWAY_TOTAL_D = _(awayTeamStats)
      .mapValues((s) => s.D)
      .values()
      .sum();

    ov.D_PER[0] = _.round(HOME_TOTAL_E / HOME_TOTAL_D, 3);
    ov.D_PER[1] = _.round(AWAY_TOTAL_E / AWAY_TOTAL_D, 3);
    ov.D_PER[2] = _.round(ov.D_PER[0] - ov.D_PER[1], 3);

    ov.CL[0] = _(homeTeamStats)
      .mapValues((s) => s.TO)
      .values()
      .sum();
    ov.CL[1] = _(awayTeamStats)
      .mapValues((s) => s.TO)
      .values()
      .sum();
    ov.CL[2] = ov.CL[0] - ov.CL[1];

    ov.I50[0] = _(homeTeamStats)
      .mapValues((s) => s.I50)
      .values()
      .sum();
    ov.I50[1] = _(awayTeamStats)
      .mapValues((s) => s.I50)
      .values()
      .sum();
    ov.I50[2] = ov.I50[0] - ov.I50[1];

    const HOME_TOTAL_G = _(homeTeamStats)
      .mapValues((s) => s.G)
      .values()
      .sum();
    const HOME_TOTAL_B = _(homeTeamStats)
      .mapValues((s) => s.B)
      .values()
      .sum();
    const AWAY_TOTAL_G = _(awayTeamStats)
      .mapValues((s) => s.G)
      .values()
      .sum();
    const AWAY_TOTAL_B = _(awayTeamStats)
      .mapValues((s) => s.B)
      .values()
      .sum();

    ov.SC_PER[0] = _.round((HOME_TOTAL_G + HOME_TOTAL_B) / ov.I50[0], 3);
    ov.SC_PER[1] = _.round((AWAY_TOTAL_G + AWAY_TOTAL_B) / ov.I50[1], 3);
    ov.SC_PER[2] = _.round(ov.SC_PER[0] - ov.SC_PER[1], 3);

    ov.CONT_POSS[0] = _(homeTeamStats)
      .mapValues((s) => s.CP)
      .values()
      .sum();
    ov.CONT_POSS[1] = _(awayTeamStats)
      .mapValues((s) => s.CP)
      .values()
      .sum();
    ov.CONT_POSS[2] = ov.CONT_POSS[0] - ov.CONT_POSS[1];

    ov.UNCON_POSS[0] = _(homeTeamStats)
      .mapValues((s) => s.UP)
      .values()
      .sum();
    ov.UNCON_POSS[1] = _(awayTeamStats)
      .mapValues((s) => s.UP)
      .values()
      .sum();
    ov.UNCON_POSS[2] = ov.UNCON_POSS[0] - ov.UNCON_POSS[1];

    const HOME_TOTAL_CM = _(homeTeamStats)
      .mapValues((s) => s.CM)
      .values()
      .sum();
    const HOME_TOTAL_UM = _(homeTeamStats)
      .mapValues((s) => s.UM)
      .values()
      .sum();
    const AWAY_TOTAL_CP = _(awayTeamStats)
      .mapValues((s) => s.CM)
      .values()
      .sum();
    const AWAY_TOTAL_UM = _(awayTeamStats)
      .mapValues((s) => s.UM)
      .values()
      .sum();

    ov.M[0] = HOME_TOTAL_CM + HOME_TOTAL_UM;
    ov.M[1] = AWAY_TOTAL_CP + AWAY_TOTAL_UM;
    ov.M[2] = ov.M[0] - ov.M[1];

    ov.F50_M[0] = _(homeTeamStats)
      .mapValues((s) => s.F50M)
      .values()
      .sum();
    ov.F50_M[1] = _(awayTeamStats)
      .mapValues((s) => s.F50M)
      .values()
      .sum();
    ov.F50_M[2] = ov.F50_M[0] - ov.F50_M[1];

    ov.UCM[0] = _(homeTeamStats)
      .mapValues((s) => s.UM)
      .values()
      .sum();
    ov.UCM[1] = _(awayTeamStats)
      .mapValues((s) => s.UM)
      .values()
      .sum();
    ov.UCM[2] = ov.UCM[0] - ov.UCM[1];

    ov.CM[0] = _(homeTeamStats)
      .mapValues((s) => s.CM)
      .values()
      .sum();
    ov.CM[1] = _(awayTeamStats)
      .mapValues((s) => s.CM)
      .values()
      .sum();
    ov.CM[2] = ov.CM[0] - ov.CM[1];

    ov.IM[0] = _(homeTeamStats)
      .mapValues((s) => s.INTM)
      .values()
      .sum();
    ov.IM[1] = _(awayTeamStats)
      .mapValues((s) => s.INTM)
      .values()
      .sum();
    ov.IM[2] = ov.IM[0] - ov.IM[1];

    ov.T[0] = _(homeTeamStats)
      .mapValues((s) => s.T)
      .values()
      .sum();
    ov.T[1] = _(awayTeamStats)
      .mapValues((s) => s.T)
      .values()
      .sum();
    ov.T[2] = ov.T[0] - ov.T[1];

    ov.FK[0] = _(homeTeamStats)
      .mapValues((s) => s.FK_F)
      .values()
      .sum();
    ov.FK[1] = _(awayTeamStats)
      .mapValues((s) => s.FK_F)
      .values()
      .sum();
    ov.FK[2] = ov.FK[0] - ov.FK[1];

    // this.logger.debug(ov);

    await this.prismaService.reportsOnMatches.createMany({
      data: _(ov)
        .keys()
        .map((k) => {
          const property = _.find(properties, {
            alias: k,
            type: 'MATCH',
          });

          if (_.isNil(property)) {
            throw new Error('AFL Result Property not found!');
          }

          return {
            matchId: match.id,
            aflResultPropertyId: property.id,
            value: _.get(ov, k),
          };
        })
        .value(),
    });

    this.logger.debug(`Publish report of match #${match.id} successful.`);
  }

  public async getStats(id: number): Promise<MatchEntity> {
    const match = await this.prismaService.match.findFirst({
      where: { id },
      include: {
        reportsOnMatches: {
          include: {
            aflResultProperty: {
              include: { parent: true },
            },
          },
        },
        aflResults: {
          include: {
            team: true,
            playersOnAFLResults: {
              include: {
                aflResultProperty: {
                  include: { parent: true },
                },
                player: true,
              },
            },
          },
        },
      },
    });

    // this.logger.debug(match);

    return match;
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

  private async getStatsFromCsv(
    filePath: string,
    team: 'HOME' | 'AWAY',
  ): Promise<{ [n: string]: CSVProperty }> {
    const buffer = await this.readCsvFromS3('csv', filePath);
    const rows = _.transform<any, { [n: string]: number[] }>(
      parse(buffer, { skip_empty_lines: true }),
      (results, row) => {
        const [k, ...args] = row as string[];

        _.assign(results, {
          [k.trim()]: _(args)
            .map((s) => _.toNumber(s))
            .map((n) => (!_.isNaN(n) ? n : 0))
            .value(),
        });
      },
      {},
    );

    return _(rows)
      .transform((result, value, key) => {
        const [
          BEHIND_AWAY,
          BEHIND_HOME,
          CLR_BU,
          CLR_CSB,
          CLR_TI,
          ,
          ,
          // CP_GB__HARD,
          // CP_GB__LOOSE,
          FK_AGAINST,
          FK_FOR,
          GOAL_AWAY,
          GOAL_HOME,
          HB_EF,
          HB_IE,
          HB_TO,
          ,
          // I50_DEEP,
          I50_I,
          ,
          // I50_SHALLOW,
          KICK_EF,
          KICK_IE,
          KICK_TO,
          MARK_C,
          MARK_F50,
          MARK_INT,
          MARK_UC,
          POSSESSION_CONTESTED,
          POSSESSION_UNCONTESTED,
          RUCK_ADV,
          RUCK_HO,
          TACKLE_EF,
          // UP_GATHER,
          // UP_HB__RECEIVE,
        ] = value;

        if (team === 'HOME') {
          const data: CSVProperty = {
            // DISPOSAL STATISTICS
            E: KICK_EF + HB_EF,
            IE: KICK_IE + HB_IE,
            TO: KICK_TO + HB_TO,
            D: 0, // data.E + data.IE + data.TO,
            PER: 0, // data.E / data.D,
            KE: KICK_EF,
            K_IE: KICK_IE,
            K_TO: KICK_TO,
            K: 0, // data.KE + data.K_IE + data.K_TO,
            K_PER: 0, // data.KE / data.K,
            HB_E: HB_EF,
            HB_IE: HB_IE,
            HB_TO: HB_TO,
            HB: 0, // data.HB_E + data.HB_IE + data.HB_TO,
            HB_PER: 0, // data.HB_E / data.HB,
            // CLEARANCES
            CLR_BU: CLR_BU,
            CLR_CSB: CLR_CSB,
            CLR_TI: CLR_TI,
            CLR: 0, // data.CLR_BU + data.CLR_CSB + data.CLR_TI,
            // POSSESSIONS AND MARKING
            CP: POSSESSION_CONTESTED,
            UP: POSSESSION_UNCONTESTED,
            CM: MARK_C,
            UM: MARK_UC,
            F50M: MARK_F50,
            INTM: MARK_INT,
            // OTHER
            HO: RUCK_HO,
            HOTA: RUCK_ADV,
            T: TACKLE_EF,
            FK_F: FK_FOR,
            FK_A: FK_AGAINST,
            I50: I50_I,
            G: GOAL_HOME,
            B: BEHIND_HOME,
          };

          data.D = data.E + data.IE + data.TO;
          data.PER = _.round(data.E / data.D, 3);

          data.K = data.KE + data.K_IE + data.K_TO;
          data.K_PER = _.round(data.KE / data.K, 3);

          data.HB = data.HB_E + data.HB_IE + data.HB_TO;
          data.HB_PER = _.round(data.HB_E / data.HB, 3) || 0;

          data.CLR = data.CLR_BU + data.CLR_CSB + data.CLR_TI;

          _.assign(result, { [key]: data });
        } else {
          const data: CSVProperty = {
            // DISPOSAL STATISTICS
            E: KICK_EF + HB_EF,
            IE: KICK_IE + HB_IE,
            TO: KICK_TO + HB_TO,
            D: 0, // data.E + data.IE + data.TO,
            PER: 0, // data.E / data.D,
            KE: KICK_EF,
            K_IE: KICK_IE,
            K_TO: KICK_TO,
            K: 0, // data.KE + data.K_IE + data.K_TO,
            K_PER: 0, // data.KE / data.K,
            HB_E: HB_EF,
            HB_IE: HB_IE,
            HB_TO: HB_TO,
            HB: 0, // data.HB_E + data.HB_IE + data.HB_TO,
            HB_PER: 0, // data.HB_E / data.HB,
            // CLEARANCES
            CLR_BU: CLR_BU,
            CLR_CSB: CLR_CSB,
            CLR_TI: CLR_TI,
            CLR: 0, // data.CLR_BU + data.CLR_CSB + data.CLR_TI,
            // POSSESSIONS AND MARKING
            CP: POSSESSION_CONTESTED,
            UP: POSSESSION_UNCONTESTED,
            CM: MARK_C,
            UM: MARK_UC,
            F50M: MARK_F50,
            INTM: MARK_INT,
            // OTHER
            HO: RUCK_HO,
            HOTA: RUCK_ADV,
            T: TACKLE_EF,
            FK_F: FK_FOR,
            FK_A: FK_AGAINST,
            I50: I50_I,
            G: GOAL_AWAY,
            B: BEHIND_AWAY,
          };

          data.D = data.E + data.IE + data.TO;
          data.PER = _.round(data.E / data.D, 3);

          data.K = data.KE + data.K_IE + data.K_TO;
          data.K_PER = _.round(data.KE / data.K, 3);

          data.HB = data.HB_E + data.HB_IE + data.HB_TO;
          data.HB_PER = _.round(data.HB_E / data.HB, 3) || 0;

          data.CLR = data.CLR_BU + data.CLR_CSB + data.CLR_TI;

          _.assign(result, { [key]: data });
        }
      }, {})
      .value();
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
