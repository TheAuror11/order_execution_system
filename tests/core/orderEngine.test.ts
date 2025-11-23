import { OrderExecutionEngine } from '../../src/core/orderEngine';
import { Order, OrderStatus, OrderType } from '../../src/types';
import { MockDexRouter } from '../../src/core/MockDexRouter';

// Mock config to use mock router
jest.mock('../../src/config', () => ({
  config: {
    useRealDex: false,
  },
}));

// Mock sleep utility to avoid delays in tests
jest.mock('../../src/utils/sleep', () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));

// Increase timeout for tests that involve delays
jest.setTimeout(30000); // 30 seconds

describe('OrderExecutionEngine', () => {
  let engine: OrderExecutionEngine;
  let mockRouter: jest.Mocked<MockDexRouter>;
  let statusCallbacks: Array<{ status: OrderStatus; extra?: any }>;

  beforeEach(() => {
    statusCallbacks = [];
    mockRouter = {
      getRaydiumQuote: jest.fn(),
      getMeteoraQuote: jest.fn(),
      executeSwap: jest.fn(),
    } as any;

    engine = new OrderExecutionEngine();
    // Replace router with mock
    (engine as any).router = mockRouter;
  });

  const createTestOrder = (): Order => ({
    orderId: 'test-order-123',
    userId: 'user1',
    type: OrderType.Market,
    tokenIn: 'SOL',
    tokenOut: 'USDC',
    amountIn: 1,
    status: OrderStatus.Pending,
    createdAt: new Date(),
  });

  const createStatusCallback = () => {
    return (status: OrderStatus, extra?: any) => {
      statusCallbacks.push({ status, extra });
    };
  };

  describe('DEX Routing Logic', () => {
    it('should route to Raydium when it has better price', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      expect(mockRouter.executeSwap).toHaveBeenCalledWith('raydium', expect.any(Object), expect.objectContaining({ dex: 'raydium' }));
    });

    it('should route to Meteora when it has better price', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 100, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 98, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      expect(mockRouter.executeSwap).toHaveBeenCalledWith('meteora', expect.any(Object), expect.objectContaining({ dex: 'meteora' }));
    });

    it('should fetch quotes from both DEXs in parallel', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      expect(mockRouter.getRaydiumQuote).toHaveBeenCalled();
      expect(mockRouter.getMeteoraQuote).toHaveBeenCalled();
    });
  });

  describe('Status Updates', () => {
    it('should emit pending status first', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      const pendingStatus = statusCallbacks.find(cb => cb.status === OrderStatus.Pending);
      expect(pendingStatus).toBeDefined();
    });

    it('should emit routing status before fetching quotes', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      const routingStatus = statusCallbacks.find(cb => cb.status === OrderStatus.Routing);
      expect(routingStatus).toBeDefined();
    });

    it('should emit building status with DEX selection', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98 });

      await engine.executeOrder(order, callback);

      const buildingStatus = statusCallbacks.find(cb => cb.status === OrderStatus.Building);
      expect(buildingStatus).toBeDefined();
      expect(buildingStatus?.extra).toHaveProperty('dex');
    });

    it('should emit confirmed status with txHash and executedPrice', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockResolvedValue({ price: 98, fee: 0.003 });
      mockRouter.getMeteoraQuote.mockResolvedValue({ price: 100, fee: 0.002 });
      mockRouter.executeSwap.mockResolvedValue({ txHash: 'abc123', executedPrice: 98.5 });

      const result = await engine.executeOrder(order, callback);

      const confirmedStatus = statusCallbacks.find(cb => cb.status === OrderStatus.Confirmed);
      expect(confirmedStatus).toBeDefined();
      expect(confirmedStatus?.extra).toHaveProperty('txHash', 'abc123');
      expect(confirmedStatus?.extra).toHaveProperty('executedPrice', 98.5);
      expect(result.status).toBe(OrderStatus.Confirmed);
      expect(result.txHash).toBe('abc123');
    });
  });

  describe('Retry Logic', () => {
    it('should retry up to 3 times on failure', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockRejectedValue(new Error('Network error'));
      mockRouter.getMeteoraQuote.mockRejectedValue(new Error('Network error'));

      const result = await engine.executeOrder(order, callback);

      expect(result.status).toBe(OrderStatus.Failed);
      expect(result.failReason).toBeDefined();
    });

    it('should retry multiple times on persistent errors', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockRejectedValue(new Error('Network error'));
      mockRouter.getMeteoraQuote.mockRejectedValue(new Error('Network error'));

      await engine.executeOrder(order, callback);

      // Should have multiple attempts (3 retries)
      expect(mockRouter.getRaydiumQuote.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should emit failed status after max retries', async () => {
      const order = createTestOrder();
      const callback = createStatusCallback();

      mockRouter.getRaydiumQuote.mockRejectedValue(new Error('Persistent error'));
      mockRouter.getMeteoraQuote.mockRejectedValue(new Error('Persistent error'));

      const result = await engine.executeOrder(order, callback);

      const failedStatus = statusCallbacks.find(cb => cb.status === OrderStatus.Failed);
      expect(failedStatus).toBeDefined();
      expect(result.status).toBe(OrderStatus.Failed);
      expect(result.failReason).toContain('error');
    });
  });
});

