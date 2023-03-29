import { Module } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, AuthService, UsersService],
})
export class LocationsModule {}
