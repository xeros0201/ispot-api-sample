import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as _ from 'lodash';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  public canActivate(ctx: ExecutionContext): boolean | Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    if (!req.isAuthenticated() || !_.isNil(req.user)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
