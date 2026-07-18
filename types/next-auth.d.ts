import "next-auth";
import type { User as CustomUser } from ".";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
  interface User extends CustomUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
