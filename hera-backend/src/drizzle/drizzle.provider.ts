import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DB } from '../types/db';
import { AppConfig } from '../config/config';
import { Logger } from '@nestjs/common';

const CONFIG = AppConfig();
const logger = new Logger(`DrizzleProvider`);

export const DrizzleWriteProvider = 'DrizzleWriteProvider';
export const DrizzleReadProvider = 'DrizzleReadProvider';

const poolConfig = {
  connectionString: CONFIG.DATABASE_URL,
  ssl: CONFIG.APP_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create a pool of read replicas
const createReadPools = () => {
  const pools = CONFIG.DATABASE_URL_REPLICAS.map((url) => {
    const pool = new Pool({
      ...poolConfig,
      connectionString: url,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error({
        message: 'Unexpected error on read client',
        stack: err.stack,
      });
    });

    return pool;
  });

  return pools;
};

//load balancer for read replicas
class ReadLoadBalancer {
  private pools: Pool[];
  private currentIndex: number = 0;

  constructor(pools: Pool[]) {
    this.pools = pools;
  }

  getNextPool(): Pool {
    const pool = this.pools[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.pools.length;
    return pool;
  }
}

export const DrizzleProvider = [
  {
    provide: DrizzleWriteProvider,
    useFactory: async () => {
      const pool = new Pool(poolConfig);

      // Handle pool errors
      pool.on('error', (err) => {
        logger.error({
          message: 'Unexpected error on write client',
          stack: err.stack,
        });
      });

      return drizzle(pool, { schema }) as DB;
    },
  },
  {
    provide: DrizzleReadProvider,
    useFactory: async () => {
      const readPools = createReadPools();
      const loadBalancer = new ReadLoadBalancer(readPools);

      // hacky way to get a round robin load balancer per request
      const proxy = new Proxy({} as DB, {
        get: (target, prop) => {
          if (typeof target[prop] === 'function') {
            return (...args: any[]) => {
              const pool = loadBalancer.getNextPool();
              const db = drizzle(pool, { schema }) as DB;
              return db[prop](...args);
            };
          }
          // Handle non-function properties (like query builders)
          const pool = loadBalancer.getNextPool();

          const db = drizzle(pool, { schema }) as DB;
          return db[prop];
        },
      });

      return proxy;
    },
  },
];
