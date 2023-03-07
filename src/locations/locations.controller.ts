import { Controller, Get } from '@nestjs/common';

import { LocationEntity } from './entities/location.entity';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('/')
  public async findAll(): Promise<LocationEntity[]> {
    return this.locationsService.findAll();
  }
}
