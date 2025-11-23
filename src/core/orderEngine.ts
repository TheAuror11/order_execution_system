import { MockDexRouter } from './MockDexRouter';
import { Order, OrderStatus } from '../types';

const MAX_RETRIES = 3;

/*
Order Execution Engine
Responsible for executing orders through the DEX Router
Handles retries, status updates, and error handling
Uses MockDexRouter for testing
*/ 
export class OrderExecutionEngine {
  //Use MockDexRouter for testing
  private router = new MockDexRouter();

  //Execute order through the DEX Router
  async executeOrder(
    order: Order,
    statusCallback: (status: OrderStatus, extra?: any) => void
  ): Promise<Order> {
    let attempt = 0;
    let lastError: any = null;

    //Retry up to MAX_RETRIES times
    while (attempt < MAX_RETRIES) {
      try {
        //Send pending status
        statusCallback(OrderStatus.Pending);

        //Send routing status
        statusCallback(OrderStatus.Routing);
        const [rQuote, mQuote] = await Promise.all([
          this.router.getRaydiumQuote(order.tokenIn, order.tokenOut, order.amountIn),
          this.router.getMeteoraQuote(order.tokenIn, order.tokenOut, order.amountIn)
        ]);

        //Select the best quote
        const useRaydium = rQuote.price < mQuote.price;
        const best: { dex: 'raydium' | 'meteora'; price: number; fee: number } = useRaydium
          ? { dex: 'raydium' as const, ...rQuote }
          : { dex: 'meteora' as const, ...mQuote };

        //Send building status
        statusCallback(OrderStatus.Building, { dex: best.dex, quote: best.price });

        //Send submitted status
        statusCallback(OrderStatus.Submitted);

        //Execute swap
        const swap = await this.router.executeSwap(best.dex, order, best);

        //Send confirmed status
        statusCallback(OrderStatus.Confirmed, {
          dex: best.dex,
          executedPrice: swap.executedPrice,
          txHash: swap.txHash
        });

        //Return order
        return {
          ...order,
          status: OrderStatus.Confirmed,
          dexUsed: best.dex,
          executedPrice: swap.executedPrice,
          txHash: swap.txHash
        };
      } catch (err: any) {
        //Send failed status
        statusCallback(OrderStatus.Failed, { error: err?.message || 'Unknown error' });
        lastError = err;
        //Retry up to MAX_RETRIES times
        attempt++;
        if (attempt < MAX_RETRIES) {
          await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    //Send failed status
    statusCallback(OrderStatus.Failed, { error: lastError?.message || 'Unknown error' });

    //Return order
    return {
      ...order,
      status: OrderStatus.Failed,
      failReason: lastError?.message || 'Unknown error'
    };
  }
}
