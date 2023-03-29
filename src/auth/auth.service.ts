import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';

import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  public async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity | undefined> {
    // 🎯 Minimum 8 characters
    // 🎯 Should contain 1 or more numbers
    // 🎯 Should contain 1 or more symbols
    // 🎯 Should contain 1 or more letters
    const r = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/;

    if (!r.test(password)) {
      throw new BadRequestException();
    }

    const user = await this.usersService.findByEmail(email);

    if (_.isNil(user)) {
      throw new NotFoundException();
    }

    if (!(await bcrypt.compare(password, user.password))) {
      // Password mismatch
      throw new BadRequestException();
    }

    return user;
  }

  public async findById(id): Promise<UserEntity> {
    return await this.usersService.findById(id);
  }
}
