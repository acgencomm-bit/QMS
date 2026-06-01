import React, { useEffect, useState, useRef } from 'react';
import { 
  Bell, 
  MapPin, 
  User, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Wifi,
  Smile,
  LogOut
} from 'lucide-react';
import { QueueState, getCategoryLabels, formatDob } from '../types';

interface TicketViewProps {
  state: QueueState;
  ticketId: string;
  onAcknowledge: (ticketId: string) => void;
  onLeaveQueue: () => void;
  onNavigateHome: () => void;
}

export default function TicketView({ state, ticketId, onAcknowledge, onLeaveQueue, onNavigateHome }: TicketViewProps) {
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const labels = getCategoryLabels(state.categorySchema);

  // Find their matching ticket in the live state
  const ticket = state.items.find(item => item.id === ticketId);

  // Play synthetic audio chime without external mp3 dependencies
  const triggerAudioAlert = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      // Node 1: Primary oscillator
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'triangle';
      osc1.frequency.value = 523.25; // C5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.4);

      // Node 2: Secondary harmony chord
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 659.25; // E5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.55);

      // Vibrate phone of attendee if API supported by standard webview/mobile browser
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.warn('Audio Context blocked by autoplay or unsupported browser:', err);
    }
  };

  // Sound triggering looping effect during called status
  useEffect(() => {
    if (ticket && ticket.status === 'called') {
      // Play once instantly on transition
      triggerAudioAlert();

      // Flashing visual tick interval
      const flashTimer = setInterval(() => {
        setFlashOn(prev => !prev);
      }, 350);

      // Audio loop alert every 3 seconds to catch attendee's focus 
      audioIntervalRef.current = setInterval(() => {
        triggerAudioAlert();
      }, 3000);

      return () => {
        clearInterval(flashTimer);
        if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
        }
      };
    } else {
      setFlashOn(false);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }
  }, [ticket?.status]);

  if (!ticket) {
    // Ticket expired or cleared
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-6 text-center font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Ticket Void</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your ticket may have been completed, canceled, or cleared by the organizer during a session reset. 
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="w-full bg-white hover:bg-zinc-100 text-black font-black py-3.5 rounded text-xs uppercase tracking-widest transition cursor-pointer"
          >
            Back to Home View
          </button>
        </div>
      </div>
    );
  }

  // Calculate People Ahead
  const getPeopleAheadCount = () => {
    const waitingItems = state.items.filter(item => item.status === 'waiting');
    if (ticket.status !== 'waiting') return 0;

    // Group items by priorityScore
    const groups: { [score: number]: any[] } = {};
    waitingItems.forEach(item => {
      const score = item.priorityScore || 0;
      if (!groups[score]) {
        groups[score] = [];
      }
      groups[score].push(item);
    });

    // Get unique priority scores sorted descending (highest priority score comes first)
    const sortedScores = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a);

    let sortedWaiting: any[] = [];
    sortedScores.forEach(score => {
      const tierItems = groups[score];
      let sortedTier: any[] = [];

      if (state.priorityMode === 'FIFO') {
        sortedTier = [...tierItems].sort((a, b) => a.joinedAt - b.joinedAt);
      } else if (state.priorityMode === 'MEMBER_FIRST') {
        sortedTier = [...tierItems].sort((a, b) => {
          if (a.type === 'member' && b.type !== 'member') return -1;
          if (a.type !== 'member' && b.type === 'member') return 1;
          return a.joinedAt - b.joinedAt;
        });
      } else if (state.priorityMode === 'RATIO_PUBLIC_3_1') {
        sortedTier = [...tierItems].sort((a, b) => {
          if (a.type !== 'member' && b.type === 'member') return -1;
          if (a.type === 'member' && b.type !== 'member') return 1;
          return a.joinedAt - b.joinedAt;
        });
      } else {
        // ratio approximation
        sortedTier = [...tierItems].sort((a, b) => {
          if (a.type === 'member' && b.type !== 'member') return -1;
          if (a.type !== 'member' && b.type === 'member') return 1;
          return a.joinedAt - b.joinedAt;
        });
      }

      sortedWaiting = [...sortedWaiting, ...sortedTier];
    });

    const index = sortedWaiting.findIndex(item => item.id === ticket.id);
    return index >= 0 ? index : 0;
  };

  const peopleAhead = getPeopleAheadCount();
  const estWaitMin = peopleAhead * 3; // Approx 3 mins per slot

  return (
    <div 
      className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${
        ticket.status === 'called' 
          ? flashOn 
            ? 'bg-rose-955 text-white bg-rose-950 font-black' 
            : 'bg-zinc-950 text-white font-black'
          : 'bg-zinc-950 text-white'
      }`}
      id="individual-ticket-tracker"
    >
      {/* Top Beacon bar */}
      <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            {ticket.type === 'member' ? `${labels.memberBadge.toUpperCase()} BOARD` : `${labels.publicBadge.toUpperCase()} TICKET`}
          </span>
        </div>

        <button
          onClick={onLeaveQueue}
          id="btn-leave-queue"
          className="text-[10px] font-sans font-black text-rose-450 hover:text-rose-400 flex items-center gap-1.5 px-3 py-2 border border-zinc-850 rounded hover:bg-zinc-900 transition uppercase tracking-widest"
        >
          <LogOut className="w-3.5 h-3.5" />
          Leave Queue
        </button>
      </div>

      {/* Main Ticket body */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md w-full mx-auto py-10">
        
        {/* State A: Waiting in Queue */}
        {ticket.status === 'waiting' && (
          <div className="space-y-6 text-center animate-fade-in animate-pulse-slow">
            <div className="space-y-1">
              <span className="text-zinc-550 text-[10px] font-black tracking-widest uppercase block">
                Active Slot ID
              </span>
              <p className="text-7xl font-black font-sans text-emerald-400 tracking-tighter uppercase italic leading-none">
                {ticket.ticketNumber}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" /> PASS OWNER
                </span>
                <span className="text-xs font-black text-white max-w-[150px] truncate uppercase tracking-widest font-mono">
                  {ticket.name}
                </span>
              </div>

              {ticket.dobDay && ticket.dobMonth && ticket.dobYear && (
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    🍰 DATE OF BIRTH
                  </span>
                  <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
                    {formatDob(ticket.dobDay, ticket.dobMonth, ticket.dobYear)}
                  </span>
                </div>
              )}

              {ticket.phoneNumber && (
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    📞 PHONE NUMBER
                  </span>
                  <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
                    {ticket.countryCode || ''} {ticket.phoneNumber}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left bg-black p-4 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">People Ahead</span>
                  <p className="text-2xl font-black font-mono text-white mt-1 italic tracking-tight">{peopleAhead}</p>
                </div>
                <div className="text-left bg-black p-4 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider block">Est. Waiting</span>
                  <p className="text-2xl font-black font-mono text-emerald-400 mt-1 italic tracking-tight font-extrabold">
                    {estWaitMin === 0 ? '< 2M' : `${estWaitMin}M`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 justify-center py-1.5 px-3 bg-zinc-900 rounded border border-zinc-800">
                <span className="w-2 h-2 rounded bg-indigo-400 animate-ping" />
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Auto-Refreshing Status</span>
              </div>
              <p className="text-xs text-zinc-500 italic max-w-xs leading-relaxed font-medium">
                Keep this window open! Direct sockets force flash vibration and rings once caller requests your slot number.
              </p>
            </div>
          </div>
        )}

        {/* State B: Called with Flashing Alert State */}
        {ticket.status === 'called' && (
          <div className="space-y-8 text-center">
            
            {/* Pulsing Alarm icon */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-rose-500/40 rounded-full animate-ping" />
              <div className="w-20 h-20 rounded-full bg-rose-600 flex items-center justify-center text-white relative z-10 border-4 border-zinc-950 shadow-2xl">
                <Bell className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-black tracking-widest text-zinc-400 uppercase italic">
                Counter Ready
              </span>
              <p className="text-8xl font-black tracking-tighter text-white uppercase italic leading-none">
                {ticket.ticketNumber}
              </p>
              <p className="text-xs text-zinc-200 mt-2 font-black uppercase tracking-widest">
                Proceed instantly to:
              </p>
              <div className="py-3 px-6 bg-white text-black rounded font-black tracking-tighter text-2xl uppercase italic shadow-2xl max-w-sm mx-auto flex items-center justify-center gap-2 border border-zinc-200">
                <MapPin className="w-5 h-5 text-black animate-bounce fill-black" />
                {ticket.calledByCounter || 'Service Desk'}
              </div>
            </div>

            {/* Acknowledge Actions */}
            <div className="space-y-4 pt-4">
              <button
                onClick={() => onAcknowledge(ticket.id)}
                id="btn-acknowledge-arrive"
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black rounded py-4 flex items-center justify-center gap-2 transition shadow-2xl text-xs uppercase cursor-pointer tracking-widest ring-4 ring-emerald-500/20 border border-emerald-300"
              >
                I AM ON MY WAY !
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
              <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-normal uppercase tracking-widest font-bold">
                Notifies staff desk instantly and returns lobby
              </p>
            </div>

          </div>
        )}

        {/* State C: Serving/Arrived Confirmation */}
        {ticket.status === 'arrived' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Smile className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Lobby Logged</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Thank you! Ticket <strong className="text-emerald-400 font-mono font-black">{ticket.ticketNumber}</strong> registered as "Arriving" at <strong className="text-white uppercase">{ticket.calledByCounter || 'the counter'}</strong>.
              </p>
            </div>

            <div className="py-4 px-5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 max-w-xs mx-auto leading-normal uppercase font-bold tracking-wider">
              Please present this screen to the staff member upon arrival. You can head back to the main lobby details screen at any time:
            </div>

            <button
              onClick={onNavigateHome}
              id="btn-return-lobby"
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-black border border-zinc-800 transition uppercase tracking-widest cursor-pointer"
            >
              Back to Home Dashboard
            </button>
          </div>
        )}

      </div>

      {/* Safety Info panel */}
      <footer className="p-5 text-center text-zinc-650 text-[10px] font-mono border-t border-zinc-900 uppercase tracking-wider font-extrabold flex items-center justify-between px-6">
        <div>Low-Latency Live Stream Web Connection</div>
        <div>No Hidden Cost</div>
      </footer>
    </div>
  );
}
