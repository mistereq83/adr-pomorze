import type { APIRoute } from 'astro';
import { registerClient, removeClient } from '../../lib/sse';

/**
 * SSE endpoint for live updates
 * 
 * Events:
 * - connected: Initial connection confirmation
 * - new_reservation: New reservation created
 * - reservation_update: Reservation status changed
 * - ping: Keep-alive (every 30s)
 */
export const GET: APIRoute = async ({ request }) => {
  // Create a new readable stream for SSE
  let clientId: string;
  
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clientId = registerClient(controller);
    },
    cancel() {
      if (clientId) {
        removeClient(clientId);
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
};
