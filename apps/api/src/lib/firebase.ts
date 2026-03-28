import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "../config/env";

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET
  });

export const bucket = getStorage(firebaseApp).bucket(env.FIREBASE_STORAGE_BUCKET);
