import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/orderController';
import { OrderWebSocketRequest } from '../types';

//API Routes For Order Execution And Status Updates
export async function registerOrderRoutes(fastify: FastifyInstance) {
  // POST Request To Execute An Order
  fastify.post(
    '/api/orders/execute',
    { websocket: false },
    OrderController.executeOrder
  );

  // POST Request To Execute An Order With Streaming
  fastify.post(
    '/api/orders/execute/stream',
    OrderController.executeOrderStream
  );

  // GET Request To Get Order Status
  fastify.get(
    '/api/orders/status/:orderId',
    OrderController.getOrderStatus
  );

  // GET Request To Get Order By ID
  fastify.get(
    '/api/orders/:orderId',
    OrderController.getOrderById
  );

  // WebSocket Route To Get Order Status Updates
  fastify.get(
    '/ws/orders/:orderId',
    { websocket: true },
    async (connection: any, req: OrderWebSocketRequest) => {
      await OrderController.handleWebSocket(connection, req);
    }
  );
}

