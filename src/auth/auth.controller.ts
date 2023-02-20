import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { ExcludePasswordInterceptor } from '../common/interceptors/exclude-password.interceptor';
import { UserEntity } from '../users/entities/user.entity';
import { CurrentUser } from '../users/users.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Controller('auth')
export class AuthController {
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ExcludePasswordInterceptor)
  public login(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }

  @Get('/check')
  @UseGuards(SessionAuthGuard)
  public check(): void {
    return;
  }

  @Delete('/logout')
  @UseGuards(SessionAuthGuard)
  public async logout(@Req() req: Request): Promise<any> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }
}
