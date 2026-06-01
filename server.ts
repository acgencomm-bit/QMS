import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { 
  QueueState, 
  QueueItem, 
  CounterState, 
  PriorityMode,
  ClientMessage,
  ServerMessage
} from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Queue Application Global State
let queueState: QueueState = {
  items: [],
  counters: [
    { id: '1', name: 'Counter 1', staffUsername: null, currentServeId: null, status: 'idle' },
    { id: '2', name: 'Counter 2', staffUsername: null, currentServeId: null, status: 'idle' },
    { id: '3', name: 'Counter 3', staffUsername: null, currentServeId: null, status: 'idle' },
    { id: '4', name: 'Counter 4', staffUsername: null, currentServeId: null, status: 'idle' },
    { id: '5', name: 'Counter 5', staffUsername: null, currentServeId: null, status: 'idle' },
  ],
  priorityMode: 'FIFO',
  accounts: [
    { username: 'Operator1', password: '123', assignedCounterId: '1' },
    { username: 'Operator2', password: '123', assignedCounterId: '2' },
    { username: 'Operator3', password: '123', assignedCounterId: '3' },
    { username: 'Operator4', password: '123', assignedCounterId: 'any' },
  ],
  categorySchema: 'option1',
};

// In-memory sequences
let memberSeq = 101;
let publicSeq = 501;
let consecutiveMembersCalled = 0;
let consecutivePublicsCalled = 0;

// Track active WebSocket connections
const connectedClients = new Set<WebSocket>();

// Create a WebSocket Server mounted to the same HTTP server
const wss = new WebSocketServer({ noServer: true });

// Listen to upgrade event on http server so that WS can share port 3000
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Broadcast Helper
function broadcast(message: ServerMessage) {
  const jsonPayload = JSON.stringify(message);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonPayload);
    }
  }
}

// State helper to trigger updates
function broadcastStateUpdate() {
  broadcast({
    type: 'state_update',
    payload: {
      items: queueState.items,
      counters: queueState.counters,
      priorityMode: queueState.priorityMode,
      accounts: queueState.accounts,
      categorySchema: queueState.categorySchema,
    }
  });
}

// Logic to select the next waiting attendee based on the dynamic prioritization rule
function selectNextWaitingItem(): QueueItem | null {
  const waitingItems = queueState.items.filter(item => item.status === 'waiting');
  if (waitingItems.length === 0) return null;

  // Find the maximum priority score present in waitingItems
  const maxScore = Math.max(...waitingItems.map(i => i.priorityScore || 0));
  
  // Filter elements that have this maximum priority score
  const topTierItems = waitingItems.filter(i => (i.priorityScore || 0) === maxScore);

  // Split into categories and sort strictly by ticket entry timestamp ascending
  const members = topTierItems
    .filter(i => i.type === 'member')
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const publics = topTierItems
    .filter(i => i.type === 'public')
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const fifo = [...topTierItems].sort((a, b) => a.joinedAt - b.joinedAt);

  let selected: QueueItem | null = null;

  if (queueState.priorityMode === 'FIFO') {
    selected = fifo[0] || null;
    consecutiveMembersCalled = 0;
    consecutivePublicsCalled = 0;
  } else if (queueState.priorityMode === 'MEMBER_FIRST') {
    selected = members[0] || publics[0] || null;
    consecutiveMembersCalled = 0;
    consecutivePublicsCalled = 0;
  } else if (queueState.priorityMode === 'RATIO_3_1') {
    consecutivePublicsCalled = 0;
    if (members.length > 0 && publics.length > 0) {
      if (consecutiveMembersCalled < 3) {
        selected = members[0];
        consecutiveMembersCalled++;
      } else {
        selected = publics[0];
        consecutiveMembersCalled = 0;
      }
    } else {
      selected = members[0] || publics[0] || null;
      if (selected?.type === 'member') {
        consecutiveMembersCalled++;
      } else {
        consecutiveMembersCalled = 0;
      }
    }
  } else if (queueState.priorityMode === 'RATIO_2_1') {
    consecutivePublicsCalled = 0;
    if (members.length > 0 && publics.length > 0) {
      if (consecutiveMembersCalled < 2) {
        selected = members[0];
        consecutiveMembersCalled++;
      } else {
        selected = publics[0];
        consecutiveMembersCalled = 0;
      }
    } else {
      selected = members[0] || publics[0] || null;
      if (selected?.type === 'member') {
        consecutiveMembersCalled++;
      } else {
        consecutiveMembersCalled = 0;
      }
    }
  } else if (queueState.priorityMode === 'RATIO_PUBLIC_3_1') {
    consecutiveMembersCalled = 0;
    if (members.length > 0 && publics.length > 0) {
      if (consecutivePublicsCalled < 3) {
        selected = publics[0];
        consecutivePublicsCalled++;
      } else {
        selected = members[0];
        consecutivePublicsCalled = 0;
      }
    } else {
      selected = publics[0] || members[0] || null;
      if (selected?.type === 'public') {
        consecutivePublicsCalled++;
      } else {
        consecutivePublicsCalled = 0;
      }
    }
  }

  return selected;
}

// WebSocket Message Router
wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws);

  // Send current state instantly on socket connect
  ws.send(JSON.stringify({
    type: 'state_update',
    payload: {
      items: queueState.items,
      counters: queueState.counters,
      priorityMode: queueState.priorityMode,
      accounts: queueState.accounts,
      categorySchema: queueState.categorySchema,
    }
  }));

  ws.on('message', (messageRaw: string) => {
    try {
      const message: ClientMessage = JSON.parse(messageRaw);
      const { type, payload } = message;

      switch (type) {
        case 'join_queue': {
          const { name, type: attendeeType, dobDay, dobMonth, dobYear, countryCode, phoneNumber } = payload;
          if (!name || !attendeeType || !dobDay || !dobMonth || !dobYear || !countryCode || !phoneNumber) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Invalid fields: Name, type, Date of Birth, Country Code, and Phone Number have to be provided' }));
            break;
          }

          const id = 'ticket_' + Math.random().toString(36).substring(2, 11);
          const num = attendeeType === 'member' ? memberSeq++ : publicSeq++;
          const prefix = attendeeType === 'member' ? 'M' : 'P';
          const ticketNumber = `${prefix}-${num}`;

          const newItem: QueueItem = {
            id,
            name,
            type: attendeeType,
            ticketNumber,
            status: 'waiting',
            joinedAt: Date.now(),
            priorityScore: 0,
            calledAt: null,
            calledByCounter: null,
            acknowledgedAt: null,
            dobDay: Number(dobDay),
            dobMonth: Number(dobMonth),
            dobYear: Number(dobYear),
            countryCode,
            phoneNumber,
          };

          queueState.items.push(newItem);

          // Return exact success info back to the joiner socket so client knows its ticket details
          ws.send(JSON.stringify({
            type: 'joined_success',
            payload: newItem
          }));

          // Notify everyone
          broadcastStateUpdate();
          break;
        }

        case 'staff_login': {
          const { counterId, username, password } = payload;
          
          const account = queueState.accounts.find(
            acc => acc.username.toLowerCase() === (username || '').trim().toLowerCase()
          );

          if (!account) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: 'Login failed: Username does not exist.' 
            }));
            break;
          }

          if (account.password !== password) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              payload: 'Login failed: Incorrect password.' 
            }));
            break;
          }

          if (account.assignedCounterId !== 'any' && account.assignedCounterId !== counterId) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: `Login failed: Account assigned only to Counter ${account.assignedCounterId}.`
            }));
            break;
          }

          const counter = queueState.counters.find(c => c.id === counterId);
          if (counter) {
            counter.staffUsername = account.username;
            counter.status = 'idle';
            broadcastStateUpdate();
          }
          break;
        }

        case 'add_staff_account': {
          const { username, password, assignedCounterId } = payload;
          if (!username || !password || !assignedCounterId) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Invalid fields: Username, Password and Counter Assignment are required' }));
            break;
          }
          const existing = queueState.accounts.find(
            acc => acc.username.toLowerCase() === username.trim().toLowerCase()
          );
          if (existing) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Username already exists' }));
            break;
          }
          queueState.accounts.push({
            username: username.trim(),
            password,
            assignedCounterId
          });
          broadcastStateUpdate();
          break;
        }

        case 'delete_staff_account': {
          const { username } = payload;
          queueState.accounts = queueState.accounts.filter(
            acc => acc.username.toLowerCase() !== (username || '').trim().toLowerCase()
          );
          broadcastStateUpdate();
          break;
        }

        case 'update_staff_account': {
          const { username, newUsername, password, assignedCounterId } = payload;
          const account = queueState.accounts.find(
            acc => acc.username.toLowerCase() === (username || '').trim().toLowerCase()
          );
          if (account) {
            if (password !== undefined) account.password = password;
            if (assignedCounterId !== undefined) account.assignedCounterId = assignedCounterId;

            // If a newUsername is requested for rename
            if (newUsername && newUsername.trim() && newUsername.trim() !== account.username) {
              const cleanedNewUser = newUsername.trim();
              const isDuplicate = queueState.accounts.some(
                acc => acc !== account && acc.username.toLowerCase() === cleanedNewUser.toLowerCase()
              );
              if (!isDuplicate) {
                const prevUser = account.username;
                account.username = cleanedNewUser;

                // Sync counter logins
                queueState.counters.forEach(c => {
                  if (c.staffUsername && c.staffUsername.toLowerCase() === prevUser.toLowerCase()) {
                    c.staffUsername = cleanedNewUser;
                  }
                });
              }
            }
            broadcastStateUpdate();
          }
          break;
        }

        case 'staff_logout': {
          const { counterId } = payload;
          const counter = queueState.counters.find(c => c.id === counterId);
          if (counter) {
            counter.staffUsername = null;
            counter.currentServeId = null;
            counter.status = 'idle';
            broadcastStateUpdate();
          }
          break;
        }

        case 'call_next': {
          const { counterId } = payload;
          const counter = queueState.counters.find(c => c.id === counterId);
          if (!counter) break;

          // If currently serving, auto-complete the previous serving ticket
          if (counter.currentServeId) {
            const currentItem = queueState.items.find(i => i.id === counter.currentServeId);
            if (currentItem && (currentItem.status === 'called' || currentItem.status === 'arrived')) {
              currentItem.status = 'completed';
            }
          }

          const nextItem = selectNextWaitingItem();
          if (nextItem) {
            nextItem.status = 'called';
            nextItem.calledAt = Date.now();
            nextItem.calledByCounter = counter.name;

            counter.currentServeId = nextItem.id;
            counter.status = 'calling';

            // Broadcast the general update
            broadcastStateUpdate();

            // Broadcast specialized flash/voice notification to specific user
            broadcast({
              type: 'ticket_called',
              payload: {
                ticketId: nextItem.id,
                ticketNumber: nextItem.ticketNumber,
                name: nextItem.name,
                counterName: counter.name,
              }
            });
          } else {
            // No next in queue
            counter.currentServeId = null;
            counter.status = 'idle';
            broadcastStateUpdate();
            ws.send(JSON.stringify({ type: 'error', payload: 'Queue is empty' }));
          }
          break;
        }

        case 'recall': {
          const { counterId } = payload;
          const counter = queueState.counters.find(c => c.id === counterId);
          if (counter && counter.currentServeId) {
            const item = queueState.items.find(i => i.id === counter.currentServeId);
            if (item) {
              // Retrigger called notification to flash attendee's screen again
              broadcast({
                type: 'ticket_called',
                payload: {
                  ticketId: item.id,
                  ticketNumber: item.ticketNumber,
                  name: item.name,
                  counterName: counter.name,
                }
              });
            }
          }
          break;
        }

        case 'complete_serve': {
          const { counterId } = payload;
          const counter = queueState.counters.find(c => c.id === counterId);
          if (counter && counter.currentServeId) {
            const item = queueState.items.find(i => i.id === counter.currentServeId);
            if (item) {
              item.status = 'completed';
            }
            counter.currentServeId = null;
            counter.status = 'idle';
            broadcastStateUpdate();
          }
          break;
        }

        case 'no_show': {
          const { counterId } = payload;
          const counter = queueState.counters.find(c => c.id === counterId);
          if (counter && counter.currentServeId) {
            const item = queueState.items.find(i => i.id === counter.currentServeId);
            if (item) {
              item.status = 'noshow';
            }
            counter.currentServeId = null;
            counter.status = 'idle';
            broadcastStateUpdate();
          }
          break;
        }

        case 'acknowledge_call': {
          const { ticketId } = payload;
          const item = queueState.items.find(i => i.id === ticketId);
          if (item && item.status === 'called') {
            item.status = 'arrived';
            item.acknowledgedAt = Date.now();

            // Find counter, update counter status to serving
            const counter = queueState.counters.find(c => c.currentServeId === ticketId);
            if (counter) {
              counter.status = 'serving';
            }
            broadcastStateUpdate();
          }
          break;
        }

        case 'update_priority': {
          const { priorityMode } = payload;
          if (priorityMode) {
            queueState.priorityMode = priorityMode;
            broadcastStateUpdate();
          }
          break;
        }

        case 'update_category_schema': {
          const { categorySchema } = payload;
          if (categorySchema === 'option1' || categorySchema === 'option2') {
            queueState.categorySchema = categorySchema;
            broadcastStateUpdate();
          }
          break;
        }

        case 'update_item_priority': {
          const { itemId, priorityScore } = payload;
          const item = queueState.items.find(i => i.id === itemId);
          if (item) {
            item.priorityScore = priorityScore;
            broadcastStateUpdate();
          }
          break;
        }

        case 'reset_queue': {
          queueState.items = [];
          queueState.counters.forEach(c => {
            c.currentServeId = null;
            c.status = 'idle';
          });
          memberSeq = 101;
          publicSeq = 501;
          consecutiveMembersCalled = 0;
          consecutivePublicsCalled = 0;
          broadcastStateUpdate();
          break;
        }

        default:
          console.warn('Unknown message type received over WS:', type);
      }
    } catch (err) {
      console.error('Error processing WS Message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// REST API logic
app.get('/api/queue-state', (req, res) => {
  res.json(queueState);
});

app.get('/api/app-url', (req, res) => {
  // Respect user environment variables, or fall back dynamically to host header 
  const hostUrl = process.env.APP_URL || (req.get('host') ? `${req.secure ? 'https' : 'http'}://${req.get('host')}` : null);
  res.json({ appUrl: hostUrl });
});

// Configure Vite in development mode or serve static files in production
async function run() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Let Express direct wildcard paths to index.html for React SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Queue Management System server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
}

run().catch((err) => {
  console.error('Failed to start server:', err);
});
