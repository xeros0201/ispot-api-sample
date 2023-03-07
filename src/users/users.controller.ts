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
import { ApiTags } from '@nestjs/swagger';

import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ExcludePasswordInterceptor } from '../common/interceptors/exclude-password.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './entities/role.enum';
import { UserEntity } from './entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './roles.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(SessionAuthGuard, RolesGuard)
@UseInterceptors(new ExcludePasswordInterceptor())
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @Roles(Role.ADMIN)
  public async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Get('/:id')
  @Roles(Role.ADMIN)
  public async findById(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findById(id);
  }

  @Post('/')
  @Roles(Role.ADMIN)
  public async create(@Body() data: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(data);
  }

  @Put('/:id')
  @Roles(Role.ADMIN)
  public async update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, data);
  }
}
