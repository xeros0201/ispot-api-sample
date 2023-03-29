import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
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
          include: { player: true },
        },
      },
    });
  }

  public async create(
    data: CreateMatchDto,
    { homeTeamCsv, awayTeamCsv }: { homeTeamCsv: string; awayTeamCsv: string },
  ): Promise<MatchEntity> {
    const uploadReqests = [];
    if (homeTeamCsv) uploadReqests.push(this.uploadCsvToS3('csv', homeTeamCsv));
    if (awayTeamCsv) uploadReqests.push(this.uploadCsvToS3('csv', awayTeamCsv));

    if (uploadReqests.length)
      [homeTeamCsv, awayTeamCsv] = await Promise.all(uploadReqests);

    const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
      this.playersService.findAllByTeamId(data.homeTeamId),
      this.playersService.findAllByTeamId(data.awayTeamId),
    ]);

    let homePlayers = [],
      awayPlayers = [];
    if (data.homePlayerIds) {
      const refHomeTeamPlayers = homeTeamPlayers.reduce(
        (obj, item) => ({ ...obj, [item.id]: item }),
        {},
      );

      homePlayers = Object.keys(data.homePlayerIds).map((key) => {
        const playerId = +_.get(data.homePlayerIds, key); // +data.homePlayerIds[key];

        return {
          playerId,
          teamId: refHomeTeamPlayers[+playerId].teamId,
          playerNumber: +key.substring(1),
        };
      });
    }

    if (data.awayPlayerIds) {
      const refAwayTeamPlayers = awayTeamPlayers.reduce(
        (obj, item) => ({ ...obj, [item.id]: item }),
        {},
      );
      awayPlayers = Object.keys(data.awayPlayerIds).map((key) => {
        const playerId = +_.get(data.awayPlayerIds, key);

        return {
          playerId,
          teamId: refAwayTeamPlayers[+playerId].teamId,
          playerNumber: +key.substring(1),
        };
      });
    }

    return this.prismaService.match.create({
      data: {
        ..._.omit(data, ['homePlayerIds', 'awayPlayerIds']),
        homeTeamCsv,
        awayTeamCsv,
        players: {
          create: [...homePlayers, ...awayPlayers],
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

    // check if match published or not
    if (match.status === MatchStatus.PUBLISHED) {
      throw new BadRequestException('You cannot edit PUBLISHED match');
    }

    if (homeTeamCsv)
      homeTeamCsv = await this.uploadCsvToS3(
        'csv',
        homeTeamCsv,
        match.homeTeamCsv,
      );

    if (awayTeamCsv)
      awayTeamCsv = await this.uploadCsvToS3(
        'csv',
        awayTeamCsv,
        match.awayTeamCsv,
      );

    const [homeTeamPlayers, awayTeamPlayers] = await Promise.all([
      this.playersService.findAllByTeamId(data.homeTeamId),
      this.playersService.findAllByTeamId(data.awayTeamId),
    ]);

    let homePlayers = [],
      awayPlayers = [];
    if (data.homePlayerIds) {
      const refHomeTeamPlayers = homeTeamPlayers.reduce(
        (obj, item) => ({ ...obj, [item.id]: item }),
        {},
      );

      homePlayers = Object.keys(data.homePlayerIds).map((key) => {
        const playerId = +_.get(data.homePlayerIds, key);

        return {
          playerId,
          teamId: refHomeTeamPlayers[+playerId].teamId,
          playerNumber: +key.substring(1),
        };
      });
    }

    if (data.awayPlayerIds) {
      const refAwayTeamPlayers = awayTeamPlayers.reduce(
        (obj, item) => ({ ...obj, [item.id]: item }),
        {},
      );
      awayPlayers = Object.keys(data.awayPlayerIds).map((key) => {
        const playerId = +_.get(data.awayPlayerIds, key);

        return {
          playerId,
          teamId: refAwayTeamPlayers[+playerId].teamId,
          playerNumber: +key.substring(1),
        };
      });
    }

    return this.prismaService.match.update({
      where: { id },
      data: {
        ..._.omit(data, ['homePlayerIds', 'awayPlayerIds']),
        homeTeamCsv,
        awayTeamCsv,
        players: {
          deleteMany: {},
          create: [...homePlayers, ...awayPlayers],
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

  public async publish(id: number): Promise<any> {
    const match = await this.prismaService.match.findFirst({
      where: { id },
      include: {
        season: { include: { league: true } },
        players: true,
        aflResults: true,
      },
    });

    const properties = await this.prismaService.resultProperty.findMany({
      where: {
        sportId: match.season.league.sportId,
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

    await this.prismaService.$transaction(async (client) => {
      await Promise.all([
        client.reportsOnMatches.deleteMany({
          where: {
            matchId: match.id,
          },
        }),
        client.playersOnAFLResults.deleteMany({
          where: {
            aflResultId: {
              in: [homeTeamAFLResult.id, awayTeamAFLResult.id],
            },
          },
        }),
      ]);

      await Promise.all([
        ..._(homeTeamStats)
          .map(async (stats, key) => {
            const player = _.find(match.players, {
              teamId: match.homeTeamId,
              playerNumber: +key.substring(1),
            });

            if (_.isNil(player)) {
              return;
            }

            await client.playersOnAFLResults.createMany({
              data: _(stats)
                .map((v, k) => {
                  const property = _.find(properties, {
                    alias: k,
                    type: 'PLAYER',
                  });

                  if (_.isNil(property)) {
                    return;
                  }

                  return {
                    aflResultId: homeTeamAFLResult.id,
                    resultPropertyId: property.id,
                    playerId: player.playerId,
                    value: v,
                  };
                })
                .value()
                .filter((item) => !!item),
            });
          })
          .value(),
        ..._(awayTeamStats)
          .map(async (stats, key) => {
            const player = _.find(match.players, {
              teamId: match.awayTeamId,
              playerNumber: +key.substring(1),
            });

            if (_.isNil(player)) {
              return;
            }

            await client.playersOnAFLResults.createMany({
              data: _(stats)
                .map((v, k) => {
                  const property = _.find(properties, {
                    alias: k,
                    type: 'PLAYER',
                  });

                  if (_.isNil(property)) {
                    return;
                  }

                  return {
                    aflResultId: awayTeamAFLResult.id,
                    resultPropertyId: property.id,
                    playerId: player.playerId,
                    value: v,
                  };
                })
                .value()
                .filter((item) => !!item),
            });
          })
          .value(),
      ]);

      const sumBy = (
        stats: { [n: string]: CSVProperty },
        k: keyof CSVProperty,
      ): number => _(stats).mapValues(k).values().sum();

      // Overview

      const overview: {
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

      const stoppage: {
        BU: [number, number, number];
        CSB: [number, number, number];
        TI: [number, number, number];
        TCLR: [number, number, number];
        HO: [number, number, number];
        HOTA: [number, number, number];
      } = {
        BU: [0, 0, 0],
        CSB: [0, 0, 0],
        TI: [0, 0, 0],
        TCLR: [0, 0, 0],
        HO: [0, 0, 0],
        HOTA: [0, 0, 0],
      };

      {
        overview.D[0] = sumBy(homeTeamStats, 'D');
        overview.D[1] = sumBy(awayTeamStats, 'D');
        overview.D[2] = overview.D[0] - overview.D[1];

        overview.K[0] = sumBy(homeTeamStats, 'K');
        overview.K[1] = sumBy(awayTeamStats, 'K');
        overview.K[2] = overview.K[0] - overview.K[1];

        overview.HB[0] = sumBy(homeTeamStats, 'HB');
        overview.HB[1] = sumBy(awayTeamStats, 'HB');
        overview.HB[2] = overview.HB[0] - overview.HB[1];

        overview.KH[0] = _.round(overview.K[0] / overview.HB[0], 2);
        overview.KH[1] = _.round(overview.K[1] / overview.HB[1], 2);
        overview.KH[2] = _.round(overview.KH[0] - overview.KH[1], 2);

        overview.D_PER[0] = _.round(
          sumBy(homeTeamStats, 'E') / sumBy(homeTeamStats, 'D'),
          3,
        );
        overview.D_PER[1] = _.round(
          sumBy(awayTeamStats, 'E') / sumBy(awayTeamStats, 'D'),
          3,
        );
        overview.D_PER[2] = _.round(overview.D_PER[0] - overview.D_PER[1], 3);

        overview.CL[0] = sumBy(homeTeamStats, 'TO');
        overview.CL[1] = sumBy(awayTeamStats, 'TO');
        overview.CL[2] = overview.CL[0] - overview.CL[1];

        overview.I50[0] = sumBy(homeTeamStats, 'I50');
        overview.I50[1] = sumBy(awayTeamStats, 'I50');
        overview.I50[2] = overview.I50[0] - overview.I50[1];

        overview.SC_PER[0] = _.round(
          (sumBy(homeTeamStats, 'G') + sumBy(homeTeamStats, 'B')) /
            overview.I50[0],
          3,
        );
        overview.SC_PER[1] = _.round(
          (sumBy(awayTeamStats, 'G') + sumBy(awayTeamStats, 'B')) /
            overview.I50[1],
          3,
        );
        overview.SC_PER[2] = _.round(
          overview.SC_PER[0] - overview.SC_PER[1],
          3,
        );

        overview.CONT_POSS[0] = sumBy(homeTeamStats, 'CP');
        overview.CONT_POSS[1] = sumBy(awayTeamStats, 'CP');
        overview.CONT_POSS[2] = overview.CONT_POSS[0] - overview.CONT_POSS[1];

        overview.UNCON_POSS[0] = sumBy(homeTeamStats, 'UP');
        overview.UNCON_POSS[1] = sumBy(awayTeamStats, 'UP');
        overview.UNCON_POSS[2] =
          overview.UNCON_POSS[0] - overview.UNCON_POSS[1];

        overview.M[0] = sumBy(homeTeamStats, 'CM') + sumBy(homeTeamStats, 'UM');
        overview.M[1] = sumBy(awayTeamStats, 'CM') + sumBy(awayTeamStats, 'UM');
        overview.M[2] = overview.M[0] - overview.M[1];

        overview.F50_M[0] = sumBy(homeTeamStats, 'F50M');
        overview.F50_M[1] = sumBy(awayTeamStats, 'F50M');
        overview.F50_M[2] = overview.F50_M[0] - overview.F50_M[1];

        overview.UCM[0] = sumBy(homeTeamStats, 'UM');
        overview.UCM[1] = sumBy(awayTeamStats, 'UM');
        overview.UCM[2] = overview.UCM[0] - overview.UCM[1];

        overview.CM[0] = sumBy(homeTeamStats, 'CM');
        overview.CM[1] = sumBy(awayTeamStats, 'CM');
        overview.CM[2] = overview.CM[0] - overview.CM[1];

        overview.IM[0] = sumBy(homeTeamStats, 'INTM');
        overview.IM[1] = sumBy(awayTeamStats, 'INTM');
        overview.IM[2] = overview.IM[0] - overview.IM[1];

        overview.T[0] = sumBy(homeTeamStats, 'T');
        overview.T[1] = sumBy(awayTeamStats, 'T');
        overview.T[2] = overview.T[0] - overview.T[1];

        overview.FK[0] = sumBy(homeTeamStats, 'FK_F');
        overview.FK[1] = sumBy(awayTeamStats, 'FK_F');
        overview.FK[2] = overview.FK[0] - overview.FK[1];

        this.logger.debug(overview);
      }

      {
        stoppage.BU[0] = sumBy(homeTeamStats, 'CLR_BU');
        stoppage.BU[1] = sumBy(awayTeamStats, 'CLR_BU');
        stoppage.BU[2] = stoppage.BU[0] - stoppage.BU[1];

        stoppage.CSB[0] = sumBy(homeTeamStats, 'CLR_CSB');
        stoppage.CSB[1] = sumBy(awayTeamStats, 'CLR_CSB');
        stoppage.CSB[2] = stoppage.CSB[0] - stoppage.CSB[1];

        stoppage.TI[0] = sumBy(homeTeamStats, 'CLR_TI');
        stoppage.TI[1] = sumBy(awayTeamStats, 'CLR_TI');
        stoppage.TI[2] = stoppage.TI[0] - stoppage.TI[1];

        stoppage.TCLR[0] = sumBy(homeTeamStats, 'CLR');
        stoppage.TCLR[1] = sumBy(awayTeamStats, 'CLR');
        stoppage.TCLR[2] = stoppage.TCLR[0] - stoppage.TCLR[1];

        stoppage.HO[0] = sumBy(homeTeamStats, 'HO');
        stoppage.HO[1] = sumBy(awayTeamStats, 'HO');
        stoppage.HO[2] = stoppage.HO[0] - stoppage.HO[1];

        stoppage.HOTA[0] = sumBy(homeTeamStats, 'HOTA');
        stoppage.HOTA[1] = sumBy(awayTeamStats, 'HOTA');
        stoppage.HOTA[2] = stoppage.HOTA[0] - stoppage.HOTA[1];

        this.logger.debug(stoppage);
      }

      await client.reportsOnMatches.createMany({
        data: _({ ...overview, ...stoppage })
          .map((v, k) => {
            const property = _.find(properties, {
              alias: k,
              type: 'MATCH',
            });

            if (_.isNil(property)) {
              throw new Error('AFL Result Property not found!');
            }

            return {
              matchId: match.id,
              resultPropertyId: property.id,
              value: v,
            };
          })
          .value(),
      });

      await client.match.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });

      this.logger.debug(`Publish report of match #${match.id} successful.`);
    });
  }

  public async getStats(id: number): Promise<{
    reports: any;
    aflResults: any;
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
        aflResults: {
          include: {
            team: true,
            playersOnAFLResults: {
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
      .mapValues((reports) =>
        _(reports)
          .map((r) => ({
            resultProperty: r.resultProperty,
            value: _(r.value)
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
          }))
          .value(),
      )
      .value();

    const aflResults = _(match.aflResults)
      .map((aflResult) => ({
        team: aflResult.team,
        players: _(aflResult.playersOnAFLResults)
          .groupBy((s) => s.playerId)
          .map((results, playerId) => {
            const { player } = _.find(results, (r) => r.playerId === +playerId);

            return {
              player,
              results: _(results)
                .map((r) => ({
                  resultProperty: r.resultProperty,
                  value: r.value,
                }))
                .groupBy((r) => r.resultProperty.parent.name)
                .value(),
            };
          })
          .value(),
      }))
      // .transform((results, aflResult) => {
      //   if (aflResult.team.id === match.homeTeamId) {
      //     _.assign(results, { home: aflResult });
      //   } else {
      //     _.assign(results, { away: aflResult });
      //   }
      // }, {})
      .value();

    return { reports, aflResults };
  }

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<MatchEntity[]> {
    return this.prismaService.match.findMany({
      where: { seasonId },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        awayTeam: true,
        homeTeam: true,
        location: true,
        aflResults: true,
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
          I50_DEEP,
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
          I50_D: I50_DEEP,
          I50: I50_I,
          // G: GOAL_HOME,
          // B: BEHIND_HOME,
        };

        if (team === 'HOME') {
          data.G = GOAL_HOME;
          data.B = BEHIND_HOME;
        } else {
          data.G = GOAL_AWAY;
          data.B = BEHIND_AWAY;
        }

        data.D = data.E + data.IE + data.TO;
        data.PER = _.round(data.E / data.D, 3);

        data.K = data.KE + data.K_IE + data.K_TO;
        data.K_PER = _.round(data.KE / data.K, 3);

        data.HB = data.HB_E + data.HB_IE + data.HB_TO;
        data.HB_PER = _.round(data.HB_E / data.HB, 3) || 0;

        data.CLR = data.CLR_BU + data.CLR_CSB + data.CLR_TI;

        _.assign(result, { [key]: data });
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
