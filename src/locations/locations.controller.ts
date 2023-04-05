import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationEntity } from './entities/location.entity';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('/')
  public async findAll(): Promise<LocationEntity[]> {
    return this.locationsService.findAll();
  }

  @Post('/')
  @UseGuards(SessionAuthGuard)
  public async create(
    @Body() data: CreateLocationDto,
  ): Promise<LocationEntity> {
    return this.locationsService.create(data);
  }
}
