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
      include: { players: true },
    });

    const [homeTeamCsv, awayTeamCsv] = await Promise.all([
      this.readCsvFromS3('csv', match.homeTeamCsv),
      this.readCsvFromS3('csv', match.awayTeamCsv),
    ]);

    const homeTeamRows = _.transform(
      parse(homeTeamCsv, { skip_empty_lines: true }),
      (results, row) => {
        const [k, ...args] = row as string[];

        _.assign(results, { [k]: args });
      },
      {},
    );
    const awayTeamRows = _.transform(
      parse(awayTeamCsv, { skip_empty_lines: true }),
      (results, row) => {
        const [k, ...args] = row as string[];

        _.assign(results, { [k]: args });
      },
      {},
    );

    const homeTeamPlayers = _.filter(
      match.players,
      (p) => p.teamId === match.homeTeamId,
    );
    const awayTeamPlayers = _.filter(
      match.players,
      (p) => p.teamId === match.awayTeamId,
    );

    const criterias = await this.prismaService.aFLResultCriteria.findMany();

    const [homeTeamAFLResult, awayTeamAFLResult] = await Promise.all([
      this.prismaService.aFLResult.create({
        data: {
          matchId: match.id,
          teamId: match.homeTeamId,
          scorePrimary: 0,
        },
      }),
      this.prismaService.aFLResult.create({
        data: {
          matchId: match.id,
          teamId: match.homeTeamId,
          scorePrimary: 0,
        },
      }),
    ]);

    await Promise.all(
      _.keys(homeTeamRows).map(async (k) => {
        const player = _.find(
          homeTeamPlayers,
          (p) => p.playerNumber === _.toNumber(k.substring(1)),
        );

        if (_.isNil(player)) {
          // throw new Error('Player not found!');

          return;
        }

        const row = _.get(homeTeamRows, k);

        await this.prismaService.aFLResult.update({
          where: { id: homeTeamAFLResult.id },
          data: {
            criterias: {
              createMany: {
                data: _.map(criterias, (c) => ({
                  playerId: player.id,
                  aflResultCriteriaId: c.id,
                  value: _.toNumber(row[c.indexInCsv]),
                })),
              },
            },
          },
        });
      }),
    );

    await Promise.all(
      _.keys(awayTeamRows).map(async (k) => {
        const player = _.find(
          awayTeamPlayers,
          (p) => p.playerNumber === _.toNumber(k.substring(1)),
        );

        if (_.isNil(player)) {
          // throw new Error('Player not found!');

          return;
        }

        const row = _.get(awayTeamRows, k);

        await this.prismaService.aFLResult.update({
          where: { id: awayTeamAFLResult.id },
          data: {
            criterias: {
              createMany: {
                data: _.map(criterias, (c) => ({
                  playerId: player.id,
                  aflResultCriteriaId: c.id,
                  value: _.toNumber(row[c.indexInCsv]),
                })),
              },
            },
          },
        });
      }),
    );

    this.logger.debug(`Publish report of match #${match.id} successful.`);
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

  public async uploadCsvToS3(
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

  public async readCsvFromS3(bucket: string, key: string): Promise<Buffer> {
    const { Body } = await this.s3
      .getObject({ Bucket: bucket, Key: key })
      .promise();

    return Buffer.from(Body as Buffer);
  }
}
