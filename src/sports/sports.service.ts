import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';

@Injectable()
export class SportsService {
  constructor(private prisma: PrismaService) {}

  create(createSportDto: CreateSportDto) {
    return this.prisma.sport.create({
      data: {
        name: createSportDto.name,
      },
    });
  }

  findAll() {
    return this.prisma.sport.findMany();
  }

  findOne(id: number) {
    return this.prisma.sport.findUnique({
      where: { id },
    });
  }

  fetchLeagues(sportId: number) {
    return this.prisma.league.findMany({
      where: { sportId },
    });
  }

  update(id: number, updateSportDto: UpdateSportDto) {
    return this.prisma.sport.update({
      where: { id },
      data: updateSportDto,
    });
  }

  remove(id: number) {
    return this.prisma.sport.delete({
      where: { id },
    });
  }
}
