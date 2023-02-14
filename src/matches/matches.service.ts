import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

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
      },
    });
  }

  public async create(data: CreateMatchDto): Promise<MatchEntity> {
    return this.prismaService.match.create({
      data: { ...data },
    });
  }

  public async update(id: number, data: UpdateMatchDto): Promise<MatchEntity> {
    return this.prismaService.match.update({ where: { id }, data });
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
