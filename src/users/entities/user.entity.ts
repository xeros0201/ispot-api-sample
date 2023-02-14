import { User } from '@prisma/client';

export class UserEntity implements User {
  id: string;

  email: string;

  firstName: string;

  lastName: string;

  password: string;

  active: boolean;
}
