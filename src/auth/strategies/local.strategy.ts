import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as _ from 'lodash';
import { Strategy } from 'passport-local';

import { UserEntity } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  public async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.authService.validateUser(email, password);

    if (_.isNil(user)) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
