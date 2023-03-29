import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as _ from 'lodash';

import { AuthService } from '../auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  public canActivate(ctx: ExecutionContext): boolean | Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    if (!req.isAuthenticated() || _.isNil(req.user)) {
      throw new UnauthorizedException();
    }

    return this._getCurrentUser(req);
  }

  private async _getCurrentUser(req): Promise<boolean> {
    const user = await this.authService.findById(req.user.id);

    _.assign(req, { user });

    return true;
  }
}
