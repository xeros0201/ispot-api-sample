import { Injectable } from '@nestjs/common';
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

    const refHomeTeamPlayers = homeTeamPlayers.reduce(
      (obj, item) => ({ ...obj, [item.id]: item }),
      {},
    );

    const refAwayTeamPlayers = awayTeamPlayers.reduce(
      (obj, item) => ({ ...obj, [item.id]: item }),
      {},
    );

    const homePlayers = Object.keys(data.homePlayerIds).map((key) => {
      const playerId = +data.homePlayerIds[key];
      return {
        playerId,
        teamId: refHomeTeamPlayers[playerId].teamId,
        playerNumber: +key.substring(1),
      };
    });
    const awayPlayers = Object.keys(data.awayPlayerIds).map((key) => {
      const playerId = +data.awayPlayerIds[key];
      return {
        playerId,
        teamId: refAwayTeamPlayers[playerId].teamId,
        playerNumber: +key.substring(1),
      };
    });

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

    const refHomeTeamPlayers = homeTeamPlayers.reduce(
      (obj, item) => ({ ...obj, [item.id]: item }),
      {},
    );

    const refAwayTeamPlayers = awayTeamPlayers.reduce(
      (obj, item) => ({ ...obj, [item.id]: item }),
      {},
    );

    const homePlayers = Object.keys(data.homePlayerIds).map((key) => {
      const playerId = +data.homePlayerIds[key];
      return {
        playerId,
        teamId: refHomeTeamPlayers[playerId].teamId,
        playerNumber: +key.substring(1),
      };
    });
    const awayPlayers = Object.keys(data.awayPlayerIds).map((key) => {
      const playerId = +data.awayPlayerIds[key];
      return {
        playerId,
        teamId: refAwayTeamPlayers[playerId].teamId,
        playerNumber: +key.substring(1),
      };
    });

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

  public async deletePlayer(
    id: number,
    playerId: number,
  ): Promise<MatchEntity> {
    return this.prismaService.match.update({
      where: { id },

      data: {
        players: {
          deleteMany: [{ id: playerId }],
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
