import { User as PrismaUser } from "@prisma/client";

export type User = PrismaUser;

export type UserProfileResponseData = {
  id: string;
  email: string;
  usedStorage: number;
  totalFiles: number;
  totalFolders: number;
  totalSharedLinks: number;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
};
