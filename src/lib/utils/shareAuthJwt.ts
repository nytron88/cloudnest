import { sign, verify, JwtPayload } from "jsonwebtoken";
import { serialize } from "cookie";
import logger from "@/lib/utils/logger";

const JWT_SECRET =
  process.env.SHARE_LINK_JWT_SECRET ||
  "your_super_secret_jwt_key_please_change_this_in_prod";

if (
  process.env.NODE_ENV === "production" &&
  JWT_SECRET === "your_super_secret_jwt_key_please_change_this_in_prod"
) {
  logger.error(
    "CRITICAL SECURITY WARNING: SHARE_LINK_JWT_SECRET is not set or using fallback. Generate a strong, random key!"
  );
}

export interface ShareAuthPayload extends JwtPayload {
  st: string;
}

const COOKIE_NAME_PREFIX = "share_auth_";
const DEFAULT_JWT_EXPIRATION_SECONDS = 60 * 60 * 24;

export const generateShareAuthCookieHeader = (
  shareToken: string,
  cookiePath: string,
  maxAgeSeconds: number = DEFAULT_JWT_EXPIRATION_SECONDS
): string => {
  const payload: ShareAuthPayload = { st: shareToken };

  const jwtToken = sign(payload, JWT_SECRET, { expiresIn: maxAgeSeconds });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
    path: cookiePath,
    sameSite: "lax" as const,
  };

  const cookieName = `${COOKIE_NAME_PREFIX}${shareToken.substring(0, 8)}`;

  return serialize(cookieName, jwtToken, cookieOptions);
};

export const verifyShareAuthJwt = (
  jwtCookieValue: string,
  expectedShareToken: string
): ShareAuthPayload | null => {
  try {
    const decoded = verify(jwtCookieValue, JWT_SECRET) as ShareAuthPayload;

    if (decoded.st === expectedShareToken) {
      return decoded;
    }
    logger.warn("JWT share auth: 'st' claim mismatch", {
      decodedToken: decoded.st,
      expectedToken: expectedShareToken,
    });
    return null;
  } catch (err: any) {
    logger.warn("JWT share auth verification failed", {
      error: err.message,
      expectedToken: expectedShareToken,
    });
    return null;
  }
};

export const getShareAuthCookieName = (shareToken: string): string => {
  return `${COOKIE_NAME_PREFIX}${shareToken.substring(0, 8)}`;
};
