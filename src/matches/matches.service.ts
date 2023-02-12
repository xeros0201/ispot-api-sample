import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { SeasonEntity } from '../seasons/entities/season.entity';
import { MatchEntity } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
