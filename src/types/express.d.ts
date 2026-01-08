import { Customer, Employee } from '@prisma/client';
import { AppAbility } from '@/config/casl-ability';

declare global {
  namespace Express {
    interface Request {
      customer?: Omit<Customer, 'password'>;
      employee?: Omit<Employee, 'password'> & {
        roleId: string | null;
        roleName?: string;
      };
      ability?: AppAbility; // CASL ability instance
    }
  }
}

export {};
