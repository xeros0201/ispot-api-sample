import { League } from './entities/league.entity';
import { Injectable } from '@nestjs/common';
import { Sport } from '@prisma/client';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  create(createLeagueDto: CreateLeagueDto) {
    return this.prisma.league.create({
      data: {
        name: createLeagueDto.name,
        sport: {
          connect: {
            id: createLeagueDto.sportId,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.league.findMany({
      include: { sport: true },
    });
  }

  findAllInSport(sportId: Sport['id']) {
    return this.prisma.league.findMany({
      where: { sportId },
    });
  }

  findOne(id: number) {
    return this.prisma.league.findUnique({
      where: { id },
      include: { sport: true },
    });
  }

  update(id: number, updateLeagueDto: UpdateLeagueDto) {
    return this.prisma.league.update({
      where: { id },
      data: {
        name: updateLeagueDto.name,
      },
    });
  }

  remove(id: number) {
    return this.prisma.league.delete({
      where: { id },
    });
  }
}
