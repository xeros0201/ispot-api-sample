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
    return this.prisma.leagues.create({
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
    return this.prisma.leagues.findMany({
      include: { sport: true },
    });
  }

  findAllInSport(sportId: Sport['id']) {
    return this.prisma.leagues.findMany({
      where: { sportId },
    });
  }

  findOne(id: number) {
    return this.prisma.leagues.findUnique({
      where: { id },
      include: { sport: true },
    });
  }

  update(id: number, updateLeagueDto: UpdateLeagueDto) {
    return this.prisma.leagues.update({
      where: { id },
      data: {
        name: updateLeagueDto.name,
      },
    });
  }

  remove(id: number) {
    return this.prisma.leagues.delete({
      where: { id },
    });
  }
}
