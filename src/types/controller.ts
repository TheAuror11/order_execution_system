import { FastifyRequest } from 'fastify';
import { Order, OrderStatus } from './order';

/*
Request body types for order controllers
*/ 

export interface ExecuteOrderRequestBody {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  userId: string;
}

/*
Query parameters for order controllers
*/ 
export interface ExecuteOrderQueryParams {
  upgrade?: 'ws' | 'websocket';
}

/*
Response types for order controllers
*/ 
export interface ExecuteOrderResponse {
  orderId: string;
}

/*
Response types for order controllers with WebSocket
*/ 
export interface ExecuteOrderWithWebSocketResponse {
  orderId: string;
  websocketUrl: string;
  message: string;
}


/*
Response types for order controllers with streaming
*/ 
export interface ExecuteOrderStreamResponse {
  orderId: string;
  streamUrl: string;
}

/*
Response types for order status
*/ 
export interface GetOrderStatusResponse {
  orderId: string;
  status: OrderStatus | string;
  source: 'live' | 'historical';
  order?: Order;
}

/*
Error response type
*/ 
export interface ErrorResponse {
  error: string;
}

/*
Request parameter types
*/ 
export interface OrderIdParams {
  orderId: string;
}

/*
Typed Fastify request types
*/
export type ExecuteOrderRequest = FastifyRequest<{
  Body: ExecuteOrderRequestBody;
  Querystring: ExecuteOrderQueryParams;
}>;

export type ExecuteOrderStreamRequest = FastifyRequest<{
  Body: ExecuteOrderRequestBody;
}>;

export type GetOrderStatusRequest = FastifyRequest<{
  Params: OrderIdParams;
}>;

export type GetOrderByIdRequest = FastifyRequest<{
  Params: OrderIdParams;
}>;

export type OrderWebSocketRequest = FastifyRequest<{
  Params: OrderIdParams;
}>;

