import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ExcludePasswordInterceptor } from '../common/interceptors/exclude-password.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(SessionAuthGuard)
@UseInterceptors(new ExcludePasswordInterceptor())
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  public async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Get('/:id')
  public async findById(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findById(id);
  }

  @Post('/')
  public async create(@Body() data: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(data);
  }

  @Put('/:id')
  public async update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, data);
  }
}
