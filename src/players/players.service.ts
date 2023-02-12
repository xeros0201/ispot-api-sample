import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { TeamEntity } from '../teams/entities/team.entity';
import { PlayerEntity } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAllByTeamIds(
    teamIds: TeamEntity['id'][],
  ): Promise<PlayerEntity[]> {
    return this.prismaService.player.findMany({
      where: {
        teamId: { in: teamIds },
      },
      include: { team: true },
    });
  }
}
