import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { SeasonEntity } from '../seasons/entities/season.entity';
import { TeamEntity } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAllBySeasonId(
    seasonId: SeasonEntity['id'],
  ): Promise<TeamEntity[]> {
    return this.prismaService.team.findMany({
      where: { seasonId },
    });
  }
}
