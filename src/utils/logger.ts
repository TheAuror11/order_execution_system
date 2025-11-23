import dotenv from 'dotenv';
dotenv.config();

/*
Logger
Responsible for logging messages to the console
*/ 

//Logger object
export const logger = {
  //Log info messages
  info: (...args: any[]) => console.log('[INFO]', ...args),
  //Log error messages
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  //Log debug messages
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  },
};
