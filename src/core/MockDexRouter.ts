import { sleep } from '../utils/sleep';
import { DexQuote, SwapResult } from '../types';

/*
Mock Implementation of DEX Router
Simulated Relatime DEX Routing and Execution With Delays
*/ 
export class MockDexRouter {
  basePrice = 100;

  async getRaydiumQuote(_tokenIn: string, _tokenOut: string, _amount: number): Promise<DexQuote> {
    await sleep(200);
    return {
      price: this.basePrice * (0.98 + Math.random() * 0.04),
      fee: 0.003,
      minAmountOut: _amount * 0.97,
    };
  }

  async getMeteoraQuote(_tokenIn: string, _tokenOut: string, _amount: number): Promise<DexQuote> {
    await sleep(200);
    return {
      price: this.basePrice * (0.97 + Math.random() * 0.05),
      fee: 0.002,
      minAmountOut: _amount * 0.97,
    };
  }

  async executeSwap(_dex: string, _order: any, _quote?: DexQuote): Promise<SwapResult> {
    await sleep(2000 + Math.random() * 1000);
    return {
      txHash: this.generateMockTxHash(),
      executedPrice: _quote?.price || this.basePrice * (0.97 + Math.random() * 0.06),
    };
  }

  private generateMockTxHash() {
    return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
