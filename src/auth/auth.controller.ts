import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

import { ExcludePasswordInterceptor } from '../common/interceptors/exclude-password.interceptor';
import { UserEntity } from '../users/entities/user.entity';
import { CurrentUser } from '../users/users.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Controller('auth')
export class AuthController {
  // @Throttle(1, 60) -> Only for testing
  @Post('/login')
  @UseGuards(LocalAuthGuard, ThrottlerGuard)
  @UseInterceptors(ExcludePasswordInterceptor)
  @HttpCode(HttpStatus.OK)
  public login(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }

  @Get('/check')
  @UseGuards(SessionAuthGuard)
  public check(@CurrentUser() user): UserEntity {
    return user;
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
