// eslint-disable-next-line @typescript-eslint/no-var-requires
import 'dotenv/config';
import { bool, cleanEnv, makeValidator, num, port, str } from 'envalid';
import { isEmpty, trim } from 'lodash';

export const numArray = makeValidator<ReadonlyArray<number>>((x) => {
  if (isEmpty(x)) {
    return [];
  }
  const arr = x.split(',').map((item) => parseInt(item));
  return arr;
});

export const strArray = makeValidator<ReadonlyArray<string>>((x) => {
  if (isEmpty(x)) {
    return [];
  }
  const arr = x.split(',').map((item) => trim(item));
  return arr;
});

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    default: 'production',
    devDefault: 'development',
    choices: ['development', 'production', 'test'],
  }),

  HOST: str({ default: undefined, devDefault: undefined }),
  PORT: port({ default: 8000, devDefault: 8000 }),
  APP_VERSION: str({ default: 'v1.0.0', devDefault: 'local' }),

  APP_ENV: str({
    default: 'production',
    devDefault: 'local',
    choices: [
      'local',
      'development',
      'test',
      'staging',
      'production',
      'unknown',
    ],
  }),
  PROXY_DEPTH: num({ default: 2, devDefault: 0 }),

  THROTTLE_TTL: num({ default: 60, devDefault: 60 }),
  THROTTLE_LIMIT: num({ default: 60, devDefault: 200 }),

  // neon
  DATABASE_URL: str({ default: '', devDefault: '' }),
  DATABASE_URL_REPLICAS: strArray({ default: [], devDefault: [] }),

  // cron jobs
  RUN_CRON_JOBS: bool({ default: false, devDefault: false }),

  // cdp
  CDP_KEY_ID: str({ default: '', devDefault: '' }),
  CDP_KEY_SECRET: str({ default: '', devDefault: '' }),
  CDP_WALLET_SECRET: str({ default: '', devDefault: '' }),

  // jwt
  JWT_SECRET: str({
    default: '',
    devDefault: '',
  }),

  // resend
  RESEND_API_KEY: str({ default: '', devDefault: '' }),

  // RPC URLS
  RPC_URLS_84532: strArray({ default: [], devDefault: [] }),
  RPC_URLS_8453: strArray({ default: [], devDefault: [] }),

  // Gravatar
  GRAVATAR_API_KEY: str({ default: '', devDefault: '' }),
});

const _AppConfig = () => ({ ...env }) as const;

const CONFIG = _AppConfig();

export const AppConfig = () => CONFIG;
