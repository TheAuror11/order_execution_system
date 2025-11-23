import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  pg: {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
  },
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
};
