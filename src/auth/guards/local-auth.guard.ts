import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(ctx)) as boolean;

    if (ctx.getType() === 'http') {
      const req = ctx.switchToHttp().getRequest();

      await super.logIn(req);
    }

    return result;
  }
}
