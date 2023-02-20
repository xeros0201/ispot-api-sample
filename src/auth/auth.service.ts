import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  public async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity | undefined> {
    const user = await this.usersService.findByEmail(email);

    if (!(await bcrypt.compare(password, user.password))) {
      // Password mismatch
      throw new UnauthorizedException();
    }

    return user;
  }
}
