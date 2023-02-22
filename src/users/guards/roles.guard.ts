import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as _ from 'lodash';

import { UserEntity } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      ctx.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request & { user: UserEntity }>();

    if (!req.isAuthenticated() || _.isNil(req.user)) {
      throw new UnauthorizedException();
    }

    return requiredRoles.some((role) => role === req.user.role);
  }
}
