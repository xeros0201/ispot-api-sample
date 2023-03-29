import { Module } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, AuthService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
