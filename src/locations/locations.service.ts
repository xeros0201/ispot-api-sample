import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { LocationEntity } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<LocationEntity[]> {
    return this.prismaService.location.findMany();
  }
}
