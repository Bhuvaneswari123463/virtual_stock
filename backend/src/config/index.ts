import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, 'PORT must be between 1 and 65535'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/virtualtrade'),
  JWT_ACCESS_SECRET: z
    .string()
    .default('virtualtrade_access_secret_development_min_32_characters_long'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('virtualtrade_refresh_secret_development_min_32_characters_long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z
    .string()
    .default('7')
    .transform((val) => parseInt(val, 10)),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  MARKET_DATA_PROVIDER: z
    .enum(['mock', 'delayed', 'live', 'yahoo', 'alphavantage'])
    .default('mock'),
  MARKET_DATA_CACHE_TTL_SECONDS: z
    .string()
    .default('30')
    .transform((val) => parseInt(val, 10)),
  MARKET_DATA_API_KEY: z.string().optional(),
  MARKET_DATA_TIMEOUT_MS: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
});

const parseConfig = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const config = parseConfig();
export type Config = typeof config;
