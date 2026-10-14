import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Map: userId -> Set of active WebSocket connections
const userSockets = new Map();

export function initWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws/chat' });

    console.log('[WebSocket] Initialized on /ws/chat');

    wss.on('connection', (ws, req) => {
        let authenticatedUserId = null;

        // Try extracting token from cookies if available
        try {
            const cookieHeader = req.headers.cookie;
            if (cookieHeader) {
                const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('auth_token='));
                if (match) {
                    const token = match.split('=')[1];
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (decoded?.userId) {
                        authenticatedUserId = decoded.userId;
                        registerUserSocket(authenticatedUserId, ws);
                        ws.send(JSON.stringify({ type: 'authenticated', userId: authenticatedUserId }));
                        console.log(`[WebSocket] User ${authenticatedUserId} connected via cookie.`);
                    }
                }
            }
        } catch (e) {
            // Ignore cookie decode error, user can authenticate via message
        }

        // Handle incoming messages
        ws.on('message', (raw) => {
            try {
                const data = JSON.parse(raw.toString());

                // Client explicit authentication message: { type: 'auth', userId, token }
                if (data.type === 'auth') {
                    try {
                        if (data.token) {
                            const decoded = jwt.verify(data.token, JWT_SECRET);
                            authenticatedUserId = decoded.userId;
                        } else if (data.userId) {
                            authenticatedUserId = data.userId;
                        }

                        if (authenticatedUserId) {
                            registerUserSocket(authenticatedUserId, ws);
                            ws.send(JSON.stringify({ type: 'authenticated', userId: authenticatedUserId }));
                            console.log(`[WebSocket] User ${authenticatedUserId} authenticated via payload.`);
                        }
                    } catch (authErr) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
                    }
                }

                // Heartbeat ping
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }

                // Typing indicator relay
                if (data.type === 'typing' && authenticatedUserId && data.receiverId) {
                    sendToUser(data.receiverId, {
                        type: 'typing',
                        senderId: authenticatedUserId,
                        isTyping: !!data.isTyping
                    });
                }
            } catch (err) {
                console.warn('[WebSocket] Malformed message received:', err.message);
            }
        });

        ws.on('close', () => {
            if (authenticatedUserId) {
                unregisterUserSocket(authenticatedUserId, ws);
                console.log(`[WebSocket] User ${authenticatedUserId} disconnected.`);
            }
        });

        ws.on('error', (err) => {
            console.error('[WebSocket] Socket error:', err.message);
        });
    });

    // Keep-alive ping interval every 30 seconds (prevents Heroku H15 idle timeout)
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    return wss;
}

function registerUserSocket(userId, ws) {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(ws);
}

function unregisterUserSocket(userId, ws) {
    const sockets = userSockets.get(userId);
    if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
            userSockets.delete(userId);
        }
    }
}

/**
 * Send real-time payload to a specific user
 */
export function sendToUser(userId, payload) {
    const sockets = userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;

    const data = JSON.stringify(payload);
    let sentCount = 0;

    sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            sentCount++;
        }
    });

    return sentCount > 0;
}
