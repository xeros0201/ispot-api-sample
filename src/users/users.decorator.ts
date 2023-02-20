import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserEntity } from './entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const { user } = ctx
      .switchToHttp()
      .getRequest<Request & { user: UserEntity }>();

    return data ? user && user[parseInt(data, 10)] : user;
  },
);
