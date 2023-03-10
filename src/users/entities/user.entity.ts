import { User, UserRole } from '@prisma/client';

export class UserEntity implements User {
  id: string;

  email: string;

  firstName: string;

  lastName: string;

  password: string;

  active: boolean;

  role: UserRole;

  createdDate: Date;

  createdUserId: string;

  updatedDate: Date;

  updatedUserId: string;
}
