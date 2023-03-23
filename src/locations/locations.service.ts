import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { CreateLocationDto } from './dto/create-location.dto';
import { LocationEntity } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<LocationEntity[]> {
    return this.prismaService.location.findMany();
  }

  public async create(data: CreateLocationDto): Promise<LocationEntity> {
    return this.prismaService.location.create({ data });
  }
}
