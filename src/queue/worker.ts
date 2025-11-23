import { Worker } from 'bullmq';
import { config } from '../config';
import { Order, OrderStatus } from '../types';
import { OrderExecutionEngine } from '../core/orderEngine';
import { WSManager } from '../ws/wsManager';
import { saveOrder } from '../db/orderRepo';
import Redis from 'ioredis';

//Initialize Redis connection
const redis = new Redis(config.redis);
//Initialize Order Execution Engine
const engine = new OrderExecutionEngine();

//Create a new worker for the order queue
export const worker = new Worker(
  'order-queue',
  //Process the order
  async (job) => {
    //Get the order from the job
    const order = job.data as Order;
    const orderId = order.orderId;

    //Set the order status to pending
    await redis.set(`order-status:${orderId}`, OrderStatus.Pending);

    //Callback to update the order status
    const statusCallback = async (status: OrderStatus, extra?: any) => {
      //Update the order status in Redis
      await redis.set(`order-status:${orderId}`, status);
      WSManager.send(orderId, { status, orderId, ...extra });
    };

    //Execute the order
    const finalOrder = await engine.executeOrder(order, statusCallback);

    //Save the order to the database
    await saveOrder(finalOrder);

    //Delete the order status from Redis
    await redis.del(`order-status:${orderId}`);

    //Return the final order
    return finalOrder;
  },
  //Options for the worker
  {
    connection: { url: config.redis },
    concurrency: 10
  }
);
