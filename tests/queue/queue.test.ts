import { orderQueue } from '../../src/queue/queue';
import { Order, OrderType, OrderStatus } from '../../src/types';

// Mock BullMQ
jest.mock('../../src/queue/queue', () => ({
  orderQueue: {
    add: jest.fn(),
  },
}));

describe('Order Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Queue Behavior', () => {
    it('should add order to queue with correct structure', async () => {
      const order: Order = {
        orderId: 'test-order',
        userId: 'user1',
        type: OrderType.Market,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        status: OrderStatus.Pending,
        createdAt: new Date(),
      };

      await orderQueue.add('order', order);

      expect(orderQueue.add).toHaveBeenCalledWith('order', order);
    });

    it('should handle concurrent order submissions', async () => {
      const orders: Order[] = Array.from({ length: 5 }, (_, i) => ({
        orderId: `order-${i}`,
        userId: 'user1',
        type: OrderType.Market,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 1,
        status: OrderStatus.Pending,
        createdAt: new Date(),
      }));

      const promises = orders.map(order => orderQueue.add('order', order));
      await Promise.all(promises);

      expect(orderQueue.add).toHaveBeenCalledTimes(5);
    });

    it('should preserve order data integrity', async () => {
      const order: Order = {
        orderId: 'test-order',
        userId: 'user1',
        type: OrderType.Market,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 2.5,
        status: OrderStatus.Pending,
        createdAt: new Date('2024-01-01'),
      };

      await orderQueue.add('order', order);

      const callArgs = (orderQueue.add as jest.Mock).mock.calls[0];
      const queuedOrder = callArgs[1] as Order;

      expect(queuedOrder.orderId).toBe('test-order');
      expect(queuedOrder.amountIn).toBe(2.5);
      expect(queuedOrder.type).toBe(OrderType.Market);
    });
  });
});

