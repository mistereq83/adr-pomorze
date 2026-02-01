// Server-Sent Events manager for live updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

// Store active SSE connections (in-memory, resets on restart)
const clients: Map<string, SSEClient> = new Map();

// Generate unique client ID
function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Encode SSE message
function encodeSSE(event: string, data: unknown): Uint8Array {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(message);
}

// Register new SSE client
export function registerClient(controller: ReadableStreamDefaultController<Uint8Array>): string {
  const id = generateClientId();
  clients.set(id, { id, controller });
  console.log(`[SSE] Client connected: ${id} (total: ${clients.size})`);
  
  // Send initial ping
  try {
    controller.enqueue(encodeSSE('connected', { clientId: id, timestamp: new Date().toISOString() }));
  } catch (e) {
    // Client already disconnected
  }
  
  return id;
}

// Remove SSE client
export function removeClient(id: string): void {
  clients.delete(id);
  console.log(`[SSE] Client disconnected: ${id} (total: ${clients.size})`);
}

// Broadcast event to all connected clients
export function broadcast(event: string, data: unknown): void {
  const message = encodeSSE(event, data);
  const disconnected: string[] = [];
  
  clients.forEach((client, id) => {
    try {
      client.controller.enqueue(message);
    } catch (e) {
      // Client disconnected, mark for removal
      disconnected.push(id);
    }
  });
  
  // Clean up disconnected clients
  disconnected.forEach(id => clients.delete(id));
  
  if (clients.size > 0) {
    console.log(`[SSE] Broadcast "${event}" to ${clients.size} clients`);
  }
}

// Notify about new reservation
export function notifyNewReservation(reservation: {
  id: number;
  participantName: string;
  courseType: string;
  createdAt: string;
}): void {
  broadcast('new_reservation', reservation);
}

// Notify about reservation status change
export function notifyReservationUpdate(reservation: {
  id: number;
  status: string;
}): void {
  broadcast('reservation_update', reservation);
}

// Get connected clients count
export function getClientsCount(): number {
  return clients.size;
}

// Keep-alive ping (call periodically)
export function pingClients(): void {
  broadcast('ping', { timestamp: new Date().toISOString() });
}
