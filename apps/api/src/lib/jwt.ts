import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthJwtPayload = {
  sub: string;
  role: "USER" | "ADMIN";
  sessionId: string;
};

export const signAccessToken = (payload: AuthJwtPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"]
  });

export const signRefreshToken = (payload: AuthJwtPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthJwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthJwtPayload;
