import React, { useEffect, useState, useRef } from 'react';
import { 
  QueueState, 
  PriorityMode, 
  AttendeeType, 
  QueueItem, 
  ServerMessage,
  ClientMessage 
} from './types';
import DisplayView from './components/DisplayView';
import JoinView from './components/JoinView';
import TicketView from './components/TicketView';
import StaffView from './components/StaffView';
import AdminView from './components/AdminView';
import ManualView from './components/ManualView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation View Status: 'display' | 'join' | 'ticket' | 'staff' | 'admin' | 'manual'
  const [view, setView] = useState<'display' | 'join' | 'ticket' | 'staff' | 'admin' | 'manual'>('display');
  const [appUrl, setAppUrl] = useState<string>('');
  
  // Real-time synced queue data
  const [queueState, setQueueState] = useState<QueueState>({
    items: [],
    counters: [],
    priorityMode: 'FIFO',
  });

  const [activeTicketId, setActiveTicketId] = useState<string>(() => {
    return localStorage.getItem('q_ticket_id') || '';
  });

  const [calledAlert, setCalledAlert] = useState<{ ticketId: string; ticketNumber: string; name: string; counterName: string } | null>(null);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);

  // Sync state between view and browser URL search parameters
  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      const ticketId = localStorage.getItem('q_ticket_id');

      if (v === 'join') {
        setView('join');
      } else if (v === 'staff') {
        setView('staff');
      } else if (v === 'admin') {
        setView('admin');
      } else if (v === 'manual') {
        setView('manual');
      } else if (ticketId && stateIncludesTicket(ticketId)) {
        setView('ticket');
      } else {
        setView('display');
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, [queueState.items.length]);

  const stateIncludesTicket = (tid: string): boolean => {
    return queueState.items.some(i => i.id === tid);
  };

  const navigateTo = (newView: 'display' | 'join' | 'ticket' | 'staff' | 'admin' | 'manual') => {
    setView(newView);
    const url = new URL(window.location.href);
    if (newView === 'display') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', newView);
    }
    window.history.pushState({}, '', url.toString());
  };

  // Fetch the definitive External App URL
  useEffect(() => {
    fetch('/api/app-url')
      .then(res => res.json())
      .then(data => {
        if (data.appUrl) {
          setAppUrl(data.appUrl);
        } else {
          setAppUrl(window.location.origin);
        }
      })
      .catch((err) => {
        console.warn('Could not discover app url, using local fallback:', err);
        setAppUrl(window.location.origin);
      });
  }, []);

  // Set up WebSocket lifecycle with reconnect capability
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          setErrorMessage('');
        };

        socket.onmessage = (event) => {
          try {
            const data: ServerMessage = JSON.parse(event.data);
            const { type, payload } = data;

            switch (type) {
              case 'state_update':
                setQueueState(payload);
                break;
              case 'joined_success': {
                const joinedItem: QueueItem = payload;
                setActiveTicketId(joinedItem.id);
                localStorage.setItem('q_ticket_id', joinedItem.id);
                setIsJoining(false);
                navigateTo('ticket');
                break;
              }
              case 'ticket_called': {
                const { ticketId: calledId, ticketNumber, name, counterName } = payload;
                if (calledId === activeTicketId) {
                  setCalledAlert({ ticketId: calledId, ticketNumber, name, counterName });
                  
                  // Alert sound synthesizer standard audio chimes
                  try {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContextClass) {
                      const audioCtx = new AudioContextClass();
                      const osc1 = audioCtx.createOscillator();
                      const gain1 = audioCtx.createGain();
                      osc1.connect(gain1);
                      gain1.connect(audioCtx.destination);
                      osc1.type = 'triangle';
                      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
                      gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
                      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
                      osc1.start(audioCtx.currentTime);
                      osc1.stop(audioCtx.currentTime + 0.4);
                    }
                  } catch (e) {
                    console.warn('Audio feedback blocked by autoplay restrictions:', e);
                  }

                  if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200, 100, 200]);
                  }
                }
                break;
              }
              case 'error':
                setIsJoining(false);
                setErrorMessage(payload || 'A server-side operation failed');
                setTimeout(() => setErrorMessage(''), 4000);
                break;
              default:
                break;
            }
          } catch (e) {
            console.error('Error decoding WebSocket payload:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (err) => {
          console.error('WebSocket connecting fault:', err);
          socket.close();
        };

      } catch (err) {
        console.error('WebSocket initialisation issue:', err);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // WS Emits helpers
  const sendWebSocketMessage = (type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: type as any, payload };
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Socket unavailable, queuing omitted:', type);
    }
  };

  // Join Action
  const handleJoinQueue = (name: string, type: AttendeeType, dobDay: number, dobMonth: number, dobYear: number, countryCode: string, phoneNumber: string) => {
    setIsJoining(true);
    sendWebSocketMessage('join_queue', { name, type, dobDay, dobMonth, dobYear, countryCode, phoneNumber });
  };

  // Staff manual attendee priority modification action
  const handleUpdateItemPriority = (itemId: string, priorityScore: number) => {
    sendWebSocketMessage('update_item_priority', { itemId, priorityScore });
  };

  // Acknowledge called ticket
  const handleAcknowledgeCall = (ticketId: string) => {
    // Notify server of arrival
    sendWebSocketMessage('acknowledge_call', { ticketId });
    
    // Clear localized local ticket so this browser is recycled
    localStorage.removeItem('q_ticket_id');
    setActiveTicketId('');

    // Wait slightly to propagate the packet and then trigger a clean browser reload/refresh back to the public dashboard
    setTimeout(() => {
      window.location.href = window.location.origin; // Reload cleanly back to public main screen
    }, 1200);
  };

  // User decides manually to leave the queue
  const handleLeaveQueue = () => {
    localStorage.removeItem('q_ticket_id');
    setActiveTicketId('');
    navigateTo('display');
  };

  // Staff Commands
  const handleStaffLogin = (counterId: string, username: string, password?: string) => {
    sendWebSocketMessage('staff_login', { counterId, username, password });
  };

  const handleAddStaffAccount = (username: string, password: string, assignedCounterId: string) => {
    sendWebSocketMessage('add_staff_account', { username, password, assignedCounterId });
  };

  const handleDeleteStaffAccount = (username: string) => {
    sendWebSocketMessage('delete_staff_account', { username });
  };

  const handleUpdateStaffAccount = (username: string, newUsername: string, password: string, assignedCounterId: string) => {
    sendWebSocketMessage('update_staff_account', { username, newUsername, password, assignedCounterId });
  };

  const handleStaffLogout = (counterId: string) => {
    sendWebSocketMessage('staff_logout', { counterId });
  };

  const handleCallNext = (counterId: string) => {
    sendWebSocketMessage('call_next', { counterId });
  };

  const handleRecall = (counterId: string) => {
    sendWebSocketMessage('recall', { counterId });
  };

  const handleCompleteServe = (counterId: string) => {
    sendWebSocketMessage('complete_serve', { counterId });
  };

  const handleNoShow = (counterId: string) => {
    sendWebSocketMessage('no_show', { counterId });
  };

  const handleUpdatePriority = (priorityMode: PriorityMode) => {
    sendWebSocketMessage('update_priority', { priorityMode });
  };

  const handleUpdateCategorySchema = (categorySchema: 'option1' | 'option2') => {
    sendWebSocketMessage('update_category_schema', { categorySchema });
  };

  const handleResetQueue = () => {
    sendWebSocketMessage('reset_queue', {});
  };

  // Auto redirect to ticket view if attendee already has an active ticket registered in the system
  useEffect(() => {
    if (activeTicketId && view === 'display' && stateIncludesTicket(activeTicketId)) {
      navigateTo('ticket');
    }
  }, [activeTicketId, queueState.items.length, view]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* WS State Warning Banner (Floating HUD top-right if disconnected) */}
      {!wsConnected && (
        <div className="fixed bottom-4 right-4 z-50 bg-rose-950/90 border border-rose-500/30 px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl backdrop-blur max-w-sm animate-pulse text-white">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
          <div className="text-xs">
            <p className="font-semibold">Reconnecting Live Hub...</p>
            <p className="text-slate-400 text-[10px]">Synchronisation might experience slight lags.</p>
          </div>
        </div>
      )}

      {/* Floating Error Toast messages */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-950 text-rose-300 border border-rose-500/20 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Primary routing layer */}
      {view === 'display' && (
        <DisplayView 
          state={queueState} 
          appUrl={appUrl} 
          onNavigateToStaff={() => navigateTo('staff')}
          onNavigateToJoin={() => navigateTo('join')}
          onNavigateToAdmin={() => navigateTo('admin')}
          onNavigateToManual={() => navigateTo('manual')}
        />
      )}

      {view === 'join' && (
        <JoinView 
          onJoin={handleJoinQueue} 
          isLoading={isJoining} 
          onNavigateHome={() => navigateTo('display')}
          categorySchema={queueState.categorySchema}
        />
      )}

      {view === 'ticket' && (
        <TicketView 
          state={queueState} 
          ticketId={activeTicketId} 
          onAcknowledge={handleAcknowledgeCall}
          onLeaveQueue={handleLeaveQueue}
          onNavigateHome={() => navigateTo('display')}
        />
      )}

      {view === 'staff' && (
        <StaffView 
          state={queueState}
          onLogin={handleStaffLogin}
          onLogout={handleStaffLogout}
          onCallNext={handleCallNext}
          onRecall={handleRecall}
          onComplete={handleCompleteServe}
          onNoShow={handleNoShow}
          onUpdatePriority={handleUpdatePriority}
          onResetQueue={handleResetQueue}
          onNavigateHome={() => navigateTo('display')}
          onUpdateItemPriority={handleUpdateItemPriority}
        />
      )}

      {view === 'admin' && (
        <AdminView
          state={queueState}
          onNavigateHome={() => navigateTo('display')}
          onAddAccount={handleAddStaffAccount}
          onDeleteAccount={handleDeleteStaffAccount}
          onUpdateAccount={handleUpdateStaffAccount}
          onResetQueue={handleResetQueue}
          onUpdateCategorySchema={handleUpdateCategorySchema}
        />
      )}

      {view === 'manual' && (
        <ManualView
          state={queueState}
          onNavigateHome={() => navigateTo('display')}
        />
      )}

      {/* Real-time attention-grabbing called ticket overlay notification */}
      {calledAlert && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/95 p-6 text-center animate-fade-in" id="ticket-called-overlay-vibration font-sans">
          {/* Intense pulsing red radar circles background */}
          <div className="absolute inset-0 bg-rose-950/20 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[300px] h-[300px] rounded-full bg-rose-500/15 animate-ping absolute duration-1000" />
            <div className="w-[500px] h-[500px] rounded-full bg-rose-500/10 animate-ping absolute duration-1000 delay-500" />
          </div>

          <div className="bg-zinc-900 border-2 border-rose-500/40 rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.35)] relative z-10 animate-scale-in text-white">
            <div className="relative w-20 h-20 mx-auto">
              {/* Spinning/glowing visual halo */}
              <div className="absolute inset-0 bg-rose-500/30 rounded-full animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-rose-600 flex items-center justify-center text-white relative z-10 border-4 border-zinc-900 shadow-xl">
                <span className="text-3xl animate-bounce">🔔</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase text-black bg-rose-450 bg-rose-400 rounded tracking-widest animate-pulse">
                Your Ticket is Ready !
              </span>
              
              <div className="space-y-1">
                <p className="text-7xl font-black font-sans tracking-tighter text-white italic leading-none uppercase">
                  {calledAlert.ticketNumber}
                </p>
                <p className="text-sm text-zinc-300 font-black uppercase tracking-wider">
                  For: {calledAlert.name}
                </p>
              </div>

              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Your high priority slot is called. Proceed instantly to:
              </p>

              <div className="py-3 px-6 bg-white text-black rounded-xl font-black tracking-tighter text-2xl uppercase italic shadow-lg flex items-center justify-center gap-2 border border-zinc-200">
                📍 {calledAlert.counterName}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                id="btn-alert-on-my-way"
                onClick={() => {
                  handleAcknowledgeCall(calledAlert.ticketId);
                  setCalledAlert(null);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black rounded-xl py-4 flex items-center justify-center gap-1.5 transition text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                I AM ON MY WAY !
              </button>
              
              <button
                id="btn-alert-dismiss"
                onClick={() => setCalledAlert(null)}
                className="w-full bg-transparent hover:bg-zinc-800 text-zinc-500 hover:text-white py-2 text-xs font-black uppercase tracking-widest transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
