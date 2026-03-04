import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Carga env vars desde el root del monorepo.
// En Docker, las env vars ya están seteadas via env_file y dotenv no las sobreescribe (override: false por defecto).
const rootDir = path.resolve(process.cwd(), '..')
dotenv.config({ path: path.resolve(rootDir, '.env.development') })
dotenv.config({ path: path.resolve(rootDir, '.env') })

const envSchema = z
  .object({
    PREPROD_DBSERVER: z.string().min(1),
    PREPROD_DBNAME: z.string().min(1),
    PREPROD_DBUSERNAME: z.string().min(1),
    PREPROD_DBPASSWORD: z.string().min(1),

    DBSERVER: z.string().min(1),
    DBNAME: z.string().min(1),
    DBUSERNAME: z.string().min(1),
    DBPASSWORD: z.string().min(1),

    // FINLOG: en pruebas, descomentar cuando esté listo
    // FINLOG_DBSERVER: z.string().min(1),
    // FINLOG_DBNAME: z.string().min(1),
    // FINLOG_DBUSERNAME: z.string().min(1),
    // FINLOG_DBPASSWORD: z.string().min(1),

    PORT: z
      .string()
      .min(1)
      .default('3000')
      .transform(val => Number(val))
      .pipe(z.number()),
    ALLOWED_ORIGINS: z
      .string()
      .optional()
      .default('http://192.168.1.68')
      .transform(val => val.split(',').map(url => url.trim()))
      .refine(urls => urls.every(url => z.string().url().safeParse(url).success), {
        message: 'Una o más URLs en ALLOWED_ORIGIN no son válidas',
      }),
    JWT_SECRET: z.string().min(1).default('your-jwt-secret-key'),
    PASS_PHRASE: z.string().min(1).default('your-pass-phrase-key'),
    SENTRY_REPORTING_ENABLED: z.preprocess(val => val === 'true', z.boolean()),
    SENTRY_DNS: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

    // Logging centralizado con Grafana Loki
    LOKI_REPORTING_ENABLED: z.preprocess(val => val === 'true', z.boolean()),
    LOKI_HOST: z.string().url().optional(),
    LOKI_USERNAME: z.string().optional(),
    LOKI_PASSWORD: z.string().optional(),
    LOKI_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional().default('info'),

    // Cache (Valkey, Redis, etc.)
    CACHE_HOST: z.string().min(1),
    CACHE_PORT: z
      .string()
      .default('6379')
      .transform(val => Number(val))
      .pipe(z.number()),
    CACHE_PASSWORD: z.string().min(1),

    // JWT Token TTL (en segundos)
    // - JWT_ACCESS_TOKEN_TTL: tiempo de vida del access token (default: 900 = 15 minutos)
    // - JWT_REFRESH_TOKEN_TTL: tiempo de vida del refresh token y credenciales en cache (default: 2592000 = 30 días)
    JWT_ACCESS_TOKEN_TTL: z
      .string()
      .default('900')
      .transform(val => Number(val))
      .pipe(z.number().positive()),
    JWT_REFRESH_TOKEN_TTL: z
      .string()
      .default('2592000')
      .transform(val => Number(val))
      .pipe(z.number().positive()),

    // Cache TTL para búsquedas recientes (en segundos, default: 86400 = 24 horas)
    BUSQUEDA_RECIENTE_CACHE_TTL: z
      .string()
      .default('86400')
      .transform(val => Number(val))
      .pipe(z.number().positive()),

    // Configuración zonas horarias
    TIMEZONE_DATABASE: z.string().default('America/Lima'),
  })
  .superRefine((data, ctx) => {
    if (data.LOKI_REPORTING_ENABLED && !data.LOKI_HOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'LOKI_HOST es obligatorio cuando LOKI_REPORTING_ENABLED=true',
        path: ['LOKI_HOST'],
      })
    }
  })

const { data, error, success } = envSchema.safeParse(process.env)

// Detener ejecución si las variables de entorno son inválidas
if (!success) {
  console.error('❌ Error en las variables de entorno', error.format())
  process.exit(1)
}

// Variables de entorno
export const {
  PREPROD_DBSERVER,
  PREPROD_DBNAME,
  PREPROD_DBUSERNAME,
  PREPROD_DBPASSWORD,

  DBSERVER,
  DBNAME,
  DBUSERNAME,
  DBPASSWORD,

  // FINLOG: en pruebas, descomentar cuando esté listo
  // FINLOG_DBSERVER,
  // FINLOG_DBNAME,
  // FINLOG_DBUSERNAME,
  // FINLOG_DBPASSWORD,

  PORT,
  ALLOWED_ORIGINS,
  JWT_SECRET,
  PASS_PHRASE,
  SENTRY_REPORTING_ENABLED,
  SENTRY_DNS,
  NODE_ENV,

  LOKI_REPORTING_ENABLED,
  LOKI_HOST,
  LOKI_USERNAME,
  LOKI_PASSWORD,
  LOKI_LOG_LEVEL,

  CACHE_HOST,
  CACHE_PORT,
  CACHE_PASSWORD,

  JWT_ACCESS_TOKEN_TTL,
  JWT_REFRESH_TOKEN_TTL,

  BUSQUEDA_RECIENTE_CACHE_TTL,

  TIMEZONE_DATABASE,
} = data
