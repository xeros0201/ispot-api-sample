import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SeasonEntity } from 'src/seasons/entities/season.entity';

import { PlayerEntity } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
