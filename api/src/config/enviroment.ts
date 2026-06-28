import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Carga env vars desde el root del monorepo.
// En Docker, las env vars ya están seteadas via env_file y dotenv no las sobreescribe (override: false por defecto).
const rootDir = path.resolve(process.cwd(), '..')
dotenv.config({ path: path.resolve(rootDir, '.env.local') })

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

    // Observabilidad
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional().default('info'),
    OTEL_DEPLOYMENT_ENV: z.enum(['development', 'cert', 'production']),
    OTEL_LOGS_ENABLED: z
      .preprocess(val => val === 'true', z.boolean())
      .optional()
      .default(false),
    OTEL_SERVICE_NAME: z.string().min(1).default('quality-tools-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://otel-collector:4318'),
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: z.string().url().optional(),
    OTEL_RESOURCE_ATTRIBUTES: z.string().default('project=quality-tools'),
    OTEL_LOG_EXPORT_INTERVAL: z
      .string()
      .default('5000')
      .transform(val => Number(val))
      .pipe(z.number().positive()),
    OTEL_LOG_EXPORT_TIMEOUT: z
      .string()
      .default('5000')
      .transform(val => Number(val))
      .pipe(z.number().positive()),

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
    if (data.OTEL_LOGS_ENABLED && !data.OTEL_EXPORTER_OTLP_ENDPOINT && !data.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'OTEL_EXPORTER_OTLP_ENDPOINT u OTEL_EXPORTER_OTLP_LOGS_ENDPOINT es obligatorio cuando OTEL_LOGS_ENABLED=true',
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
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

  LOG_LEVEL,
  OTEL_DEPLOYMENT_ENV,
  OTEL_LOGS_ENABLED,
  OTEL_SERVICE_NAME,
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  OTEL_RESOURCE_ATTRIBUTES,
  OTEL_LOG_EXPORT_INTERVAL,
  OTEL_LOG_EXPORT_TIMEOUT,

  CACHE_HOST,
  CACHE_PORT,
  CACHE_PASSWORD,

  JWT_ACCESS_TOKEN_TTL,
  JWT_REFRESH_TOKEN_TTL,

  BUSQUEDA_RECIENTE_CACHE_TTL,

  TIMEZONE_DATABASE,
} = data
