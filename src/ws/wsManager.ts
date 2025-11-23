import type WebSocket from 'ws';

/*
WebSocket Manager
Responsible for managing WebSocket connections for order status updates
*/ 

//WebSocket map type
type WSMap = Map<string, WebSocket>;

// WebSocket Class To Manage WebSocket Connections
class WSManagerClass {
  orderClients: WSMap = new Map();

  //Add a new WebSocket client
  addClient(orderId: string, ws: WebSocket) {
    this.orderClients.set(orderId, ws);
  }

  //Remove a WebSocket client
  removeClient(orderId: string) {
    this.orderClients.delete(orderId);
  }

  //Send a message to a WebSocket client
  send(orderId: string, data: any) {
    //Get the WebSocket client
    const ws = this.orderClients.get(orderId);
    //If the WebSocket client exists, send the message
    if (ws) {
      try {
        //Serialize the message
        const message = JSON.stringify(data);
        ws.send(message);
        // Log for debugging (can be removed in production)
        if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
          console.log(`[WSManager] Sent to ${orderId}:`, data.status || 'update');
        }
      } catch (error: any) {
        //If the WebSocket client is closed/disconnected, log the error
        if (process.env.NODE_ENV !== 'test') {
          console.error(`[WSManager] Error sending to ${orderId}:`, error.message);
        }
        // Remove disconnected client
        this.removeClient(orderId);
      }
    } else {
      //If the WebSocket client is not found, log the warning
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.warn(`[WSManager] No WebSocket client found for orderId: ${orderId}`);
      }
    }
  }
}

//Export the WebSocket Manager
export const WSManager = new WSManagerClass();
