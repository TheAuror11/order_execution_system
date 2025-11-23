import { WSManager } from '../../src/ws/wsManager';
import WebSocket from 'ws';

// Mock WebSocket
class MockWebSocket {
  send = jest.fn();
  close = jest.fn();
  readyState = WebSocket.OPEN;
  on = jest.fn();
}

describe('WSManager', () => {
  beforeEach(() => {
    // Clear all clients before each test
    WSManager.orderClients.clear();
  });

  describe('addClient', () => {
    it('should add a WebSocket client for an orderId', () => {
      const mockWs = new MockWebSocket() as any;
      WSManager.addClient('order-123', mockWs);

      expect(WSManager.orderClients.has('order-123')).toBe(true);
      expect(WSManager.orderClients.get('order-123')).toBe(mockWs);
    });

    it('should allow multiple clients for different orders', () => {
      const ws1 = new MockWebSocket() as any;
      const ws2 = new MockWebSocket() as any;

      WSManager.addClient('order-1', ws1);
      WSManager.addClient('order-2', ws2);

      expect(WSManager.orderClients.size).toBe(2);
      expect(WSManager.orderClients.get('order-1')).toBe(ws1);
      expect(WSManager.orderClients.get('order-2')).toBe(ws2);
    });
  });

  describe('removeClient', () => {
    it('should remove a client when disconnected', () => {
      const mockWs = new MockWebSocket() as any;
      WSManager.addClient('order-123', mockWs);
      
      expect(WSManager.orderClients.has('order-123')).toBe(true);
      
      WSManager.removeClient('order-123');
      
      expect(WSManager.orderClients.has('order-123')).toBe(false);
    });

    it('should handle removal of non-existent client gracefully', () => {
      expect(() => WSManager.removeClient('non-existent')).not.toThrow();
    });
  });

  describe('send', () => {
    it('should send message to connected client', () => {
      const mockWs = new MockWebSocket() as any;
      WSManager.addClient('order-123', mockWs);

      const message = { orderId: 'order-123', status: 'pending' };
      WSManager.send('order-123', message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle missing client gracefully', () => {
      expect(() => {
        WSManager.send('non-existent', { status: 'pending' });
      }).not.toThrow();
    });

    it('should handle closed socket gracefully', () => {
      const mockWs = new MockWebSocket() as any;
      mockWs.send.mockImplementation(() => {
        throw new Error('Socket closed');
      });
      
      WSManager.addClient('order-123', mockWs);

      expect(() => {
        WSManager.send('order-123', { status: 'pending' });
      }).not.toThrow();
    });

    it('should send status updates in correct format', () => {
      const mockWs = new MockWebSocket() as any;
      WSManager.addClient('order-123', mockWs);

      const statusUpdate = {
        orderId: 'order-123',
        status: 'confirmed',
        txHash: 'abc123',
        executedPrice: 98.5,
      };

      WSManager.send('order-123', statusUpdate);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(statusUpdate));
    });
  });

  describe('WebSocket Lifecycle', () => {
    it('should manage complete lifecycle: add -> send -> remove', () => {
      const mockWs = new MockWebSocket() as any;
      
      // Add client
      WSManager.addClient('order-123', mockWs);
      expect(WSManager.orderClients.has('order-123')).toBe(true);

      // Send message
      WSManager.send('order-123', { status: 'pending' });
      expect(mockWs.send).toHaveBeenCalled();

      // Remove client
      WSManager.removeClient('order-123');
      expect(WSManager.orderClients.has('order-123')).toBe(false);
    });
  });
});

