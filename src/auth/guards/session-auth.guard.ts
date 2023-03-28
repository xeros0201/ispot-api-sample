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
  private async getCurrentUser(req): Promise<boolean> {
    req.user = await this.authService.getCurrentUser(req.user.id);
    return true;
  }
  public canActivate(ctx: ExecutionContext): boolean | Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    if (!req.isAuthenticated() || _.isNil(req.user)) {
      throw new UnauthorizedException();
    }
    return this.getCurrentUser(req);
  }
}
