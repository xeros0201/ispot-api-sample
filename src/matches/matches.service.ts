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
