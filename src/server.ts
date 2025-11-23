import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { config } from './config';
import { registerOrderRoutes } from './routes/orderRoutes';

//Function to start the server
async function startServer() {
  // Initialize Fastify
  const fastify = Fastify({ logger: true });
  
  // Register WebSocket plugin
  await fastify.register(fastifyWebsocket);

  // Register routes
  await registerOrderRoutes(fastify);

  // Start server
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server listening on http://0.0.0.0:${config.port}`);

  // Start worker **after** server start
  await import('./queue/worker');
}

//Start the server
startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});