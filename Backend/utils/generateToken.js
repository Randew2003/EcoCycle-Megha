import jwt from "jsonwebtoken";

/**
 * Generate JWT Token
 * Creates a signed JWT token with user payload
 */
export function generateToken(payload) {
  const secret = process.env.JWT_SECRET || "__DEV_FALLBACK_SECRET__";
  const expiresIn = process.env.JWT_EXPIRES || "7d";

  if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET is not set. Using fallback secret for development/testing only.");
  }

  return jwt.sign(payload, secret, { expiresIn });
}