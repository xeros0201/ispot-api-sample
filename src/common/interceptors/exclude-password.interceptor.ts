import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  public intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value: any) => {
        if (_.isArray(value)) {
          (value as UserEntity[]).forEach((u) => {
            u.password = undefined;
          });
        } else {
          (value as UserEntity).password = undefined;
        }

        return value;
      }),
    );
  }
}
