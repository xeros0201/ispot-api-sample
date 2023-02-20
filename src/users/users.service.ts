import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  public async findByEmail(email: string): Promise<UserEntity> {
    return this.prismaService.user.findFirst({
      where: { email },
    });
  }

  public async create(data: CreateUserDto): Promise<UserEntity> {
    data.password = await this.hashPassword(data.password);

    return this.prismaService.user.create({ data });
  }

  public async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    data.password = await this.hashPassword(data.password);

    return this.prismaService.user.update({ where: { id }, data });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
