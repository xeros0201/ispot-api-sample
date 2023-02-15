import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<UserEntity[]> {
    return this.prismaService.user.findMany();
  }

  public async findById(id: string): Promise<UserEntity> {
    return this.prismaService.user.findFirst({
      where: { id },
    });
  }

  public async create(data: CreateUserDto): Promise<UserEntity> {
    return this.prismaService.user.create({ data });
  }

  public async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    return this.prismaService.user.update({ where: { id }, data });
  }
}
