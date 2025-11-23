import { FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { orderQueue } from '../queue/queue';
import { getOrderById as getOrderFromDb } from '../db/orderRepo';
import { WSManager } from '../ws/wsManager';
import Redis from 'ioredis';
import { config } from '../config';
import {
  Order,
  OrderType,
  OrderStatus,
  ExecuteOrderRequest,
  ExecuteOrderStreamRequest,
  GetOrderStatusRequest,
  GetOrderByIdRequest,
  OrderWebSocketRequest,
  ExecuteOrderResponse,
  ExecuteOrderWithWebSocketResponse,
  ExecuteOrderStreamResponse,
  GetOrderStatusResponse,
} from '../types';

// Initialize Redis connection for controller
const redis = new Redis(config.redis);

/*
Order Controller Class:
It have the core logic for order execution and status updates.
executeOrder: Submit a new order for execution
executeOrderStream: Submit a new order for execution with streaming endpoint
getOrderStatus: Get order status (live or historical)
getOrderById: Get full order details from database
handleWebSocket: Handle WebSocket connection for order status updates
sendInitialStatus: Send initial status to WebSocket client
*/
export class OrderController {
  //Submit a new order for execution
  static async executeOrder(
    req: ExecuteOrderRequest,
    reply: FastifyReply
  ): Promise<ExecuteOrderResponse | ExecuteOrderWithWebSocketResponse | void> {
    const { tokenIn, tokenOut, amountIn, userId } = req.body;

    // Validation
    if (!tokenIn || !tokenOut || typeof amountIn !== 'number' || !userId) {
      reply.code(400).send({ error: 'Invalid parameters' });
      return;
    }

    // Create order
    const orderId = uuidv4();
    const order: Order = {
      orderId,
      userId,
      type: OrderType.Market,
      tokenIn,
      tokenOut,
      amountIn,
      status: OrderStatus.Pending,
      createdAt: new Date(),
    };

    // Queue order for processing
    await orderQueue.add('order', order);

    // Check if client wants WebSocket upgrade via query parameter
    const upgrade = req.query?.upgrade;
    if (upgrade === 'ws' || upgrade === 'websocket') {
      const response: ExecuteOrderWithWebSocketResponse = {
        orderId,
        websocketUrl: `/ws/orders/${orderId}`,
        message: 'Connect to the websocketUrl to receive live updates'
      };
      return response;
    }

    // Regular HTTP response
    const response: ExecuteOrderResponse = { orderId };
    return response;
  }

  //Submit order with streaming endpoint (returns WebSocket URL)
  static async executeOrderStream(
    req: ExecuteOrderStreamRequest,
    reply: FastifyReply
  ): Promise<ExecuteOrderStreamResponse | void> {
    const { tokenIn, tokenOut, amountIn, userId } = req.body;

    // Validation
    if (!tokenIn || !tokenOut || typeof amountIn !== 'number' || !userId) {
      reply.code(400).send({ error: 'Invalid parameters' });
      return;
    }

    // Create order
    const orderId = uuidv4();
    const order: Order = {
      orderId,
      userId,
      type: OrderType.Market,
      tokenIn,
      tokenOut,
      amountIn,
      status: OrderStatus.Pending,
      createdAt: new Date(),
    };

    // Queue order for processing
    await orderQueue.add('order', order);

    // Return orderId with WebSocket URL
    const response: ExecuteOrderStreamResponse = {
      orderId,
      streamUrl: `/ws/orders/${orderId}`
    };
    return response;
  }

  //Get order status (live or historical)
  static async getOrderStatus(
    req: GetOrderStatusRequest,
    reply: FastifyReply
  ): Promise<GetOrderStatusResponse | void> {
    const { orderId } = req.params;

    // Check for live status in Redis
    const liveStatus = await redis.get(`order-status:${orderId}`);
    if (liveStatus) {
      const response: GetOrderStatusResponse = {
        orderId,
        status: liveStatus,
        source: 'live'
      };
      return response;
    }

    // Check database for historical status
    const order = await getOrderFromDb(orderId);
    if (order) {
      const response: GetOrderStatusResponse = {
        orderId,
        status: order.status,
        source: 'historical',
        order,
      };
      return response;
    }

    reply.code(404).send({ error: 'Order not found' });
  }

  //Get full order details from database
  static async getOrderById(
    req: GetOrderByIdRequest,
    reply: FastifyReply
  ): Promise<Order | void> {
    const { orderId } = req.params;

    const order = await getOrderFromDb(orderId);
    if (!order) {
      reply.code(404).send({ error: 'Order not found' });
      return;
    }

    return order;
  }

  //Handle WebSocket connection for order status updates
  static async handleWebSocket(connection: any, req: OrderWebSocketRequest) {
    // Fastify WebSocket connection
    const ws = connection?.socket || connection;
    
    if (!ws || typeof ws.send !== 'function') {
      req.log.warn(`WebSocket handler: Invalid connection object (hasConnection: ${!!connection}, hasSocket: ${!!connection?.socket})`);
      return;
    }

    const { orderId } = req.params;
    req.log.info(`WebSocket connection established for order: ${orderId}`);

    // Register WebSocket client
    WSManager.addClient(orderId, ws);

    // Handle connection close
    ws.on('close', () => {
      req.log.info(`WebSocket connection closed for order: ${orderId}`);
      WSManager.removeClient(orderId);
    });

    // Send initial status immediately
    await OrderController.sendInitialStatus(orderId, ws);
  }

  //Send initial status to WebSocket client
  private static async sendInitialStatus(orderId: string, ws: any) {
    const live = await redis.get(`order-status:${orderId}`);
    
    if (live) {
      // Order is currently being processed
      const message = { orderId, status: live, source: 'live' };
      ws.send(JSON.stringify(message));
      WSManager.send(orderId, message);
    } else {
      // Check if order is completed
      const order = await getOrderFromDb(orderId);
      if (order) {
        // Order completed, send historical status
        const message = {
          orderId,
          status: order.status,
          source: 'historical',
          order,
        };
        ws.send(JSON.stringify(message));
        WSManager.send(orderId, message);
      } else {
        // Order doesn't exist yet, send pending status
        const message = {
          orderId,
          status: 'pending',
          source: 'live',
          message: 'Order queued, waiting for processing...'
        };
        ws.send(JSON.stringify(message));
        WSManager.send(orderId, message);
      }
    }
  }
}

