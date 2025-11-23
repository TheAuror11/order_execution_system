export type OrderID = string;
export type UserID = string;

/*
Order Types
*/ 

//Order type
export enum OrderType {
  Market = 'market',
}

//Order status
export enum OrderStatus {
  Pending = 'pending',
  Routing = 'routing',
  Building = 'building',
  Submitted = 'submitted',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

//Order interface
export interface Order {
  orderId: OrderID;
  userId: UserID;
  type: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  status: OrderStatus;
  createdAt: Date;
  dexUsed?: 'raydium' | 'meteora';
  executedPrice?: number;
  txHash?: string;
  failReason?: string;
}

//Dex quote interface
export interface DexQuote {
  price: number;
  fee: number;
  minAmountOut?: number;
  poolId?: string;
}

//Swap result interface
export interface SwapResult {
  txHash: string;
  executedPrice: number;
}

