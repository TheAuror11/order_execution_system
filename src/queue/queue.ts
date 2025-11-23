import { Queue } from 'bullmq';
import { config } from '../config';

/*
Order Queue
Responsible for queuing orders for processing
Uses Redis as the message broker
*/ 

// A new queue for orders with Redis as the message broker
export const orderQueue = new Queue('order-queue', {
  connection: { url: config.redis }
});
