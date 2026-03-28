import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "../config/env";

const hasFirebaseConfig =
  Boolean(env.FIREBASE_PROJECT_ID) &&
  Boolean(env.FIREBASE_CLIENT_EMAIL) &&
  Boolean(env.FIREBASE_PRIVATE_KEY) &&
  Boolean(env.FIREBASE_STORAGE_BUCKET);

type BucketLike = {
  name: string;
  file: (path: string) => {
    save: (data: Buffer, options?: Record<string, unknown>) => Promise<unknown>;
  };
};

const fallbackBucket: BucketLike = {
  name: env.FIREBASE_STORAGE_BUCKET,
  file: () => ({
    save: async () => {
      throw new Error("FIREBASE_CONFIG_MISSING");
    }
  })
};

export const bucket: BucketLike = hasFirebaseConfig
  ? getStorage(
      getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          }),
          storageBucket: env.FIREBASE_STORAGE_BUCKET
        })
    ).bucket()
  : fallbackBucket;
