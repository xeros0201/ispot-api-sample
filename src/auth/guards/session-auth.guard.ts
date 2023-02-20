import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as _ from 'lodash';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  public canActivate(ctx: ExecutionContext): boolean | Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    return req.isAuthenticated() && !_.isNil(req.user);
  }
}
