import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { UserEntity } from '../users/entities/user.entity';
import { CurrentUser } from '../users/user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Controller('auth')
export class AuthController {
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  public login(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }

  @Delete('/logout')
  @UseGuards(SessionAuthGuard)
  public async logout(@Req() req: Request): Promise<any> {
    await new Promise<void>((resolve) => {
      req.session.destroy(() => {
        resolve();
      });
    });
  }

  @Get('/check')
  @UseGuards(SessionAuthGuard)
  public check(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }
}
