import { Pool } from 'pg';
import { config } from '../config';

//Create a new pool connection to the database
export const pgPool = new Pool(config.pg);
