import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) throw new Error(`Missing env: ${key}`);
  return value;
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "4000"), 10),
  API_URL: getEnv("API_URL", "http://localhost:4000"),
  WEB_URL: getEnv("WEB_URL", "http://localhost:3000"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES: getEnv("JWT_ACCESS_EXPIRES", "15m"),
  JWT_REFRESH_EXPIRES: getEnv("JWT_REFRESH_EXPIRES", "7d"),
  UPLOAD_DIR: getEnv("UPLOAD_DIR", "../../uploads"),
  GROQ_API_KEY: getEnv("GROQ_API_KEY", ""),
};