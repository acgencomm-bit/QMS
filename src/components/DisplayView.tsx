import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Users, 
  Tv, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  LogIn,
  Flame,
  Award,
  Settings,
  BookOpen
} from 'lucide-react';
import { QueueState, getCategoryLabels } from '../types';

interface DisplayViewProps {
  state: QueueState;
  appUrl: string;
  onNavigateToStaff: () => void;
  onNavigateToJoin: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToManual: () => void;
}

export default function DisplayView({ state, appUrl, onNavigateToStaff, onNavigateToJoin, onNavigateToAdmin, onNavigateToManual }: DisplayViewProps) {
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const labels = getCategoryLabels(state.categorySchema);
  const joinUrl = `${appUrl || window.location.origin}?view=join`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#09090b', // zinc-950
        light: '#ffffff', // white
      },
    })
      .then(url => setQrCodeData(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [joinUrl]);

  // Statistics
  const waitingList = state.items.filter(item => item.status === 'waiting');
  const completedCount = state.items.filter(item => item.status === 'completed').length;
  const membersWaiting = waitingList.filter(item => item.type === 'member').length;
  const publicWaiting = waitingList.filter(item => item.type === 'public').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans" id="display-dashboard">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white text-black font-black px-4 py-1.5 text-2xl tracking-tighter uppercase italic">
            V-QUEUE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Live Socket Active
            </span>
          </div>
        </div>

        {/* Action Button Links */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToJoin}
            id="btn-mobile-join"
            className="md:hidden px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black uppercase tracking-widest rounded transition cursor-pointer"
          >
            Join Queue
          </button>
          <button
            onClick={onNavigateToManual}
            id="btn-manual-portal"
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-indigo-400 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/40 rounded border border-indigo-500/30 uppercase tracking-wider transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            User Manual
          </button>
          <button
            onClick={onNavigateToAdmin}
            id="btn-admin-portal"
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-805 uppercase tracking-wider transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            Admin Panel
          </button>
          <button
            onClick={onNavigateToStaff}
            id="btn-staff-portal"
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 uppercase tracking-wider transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Staff Portal
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Active Board */}
        <div className="lg:col-span-8 space-y-6 flex flex-col justify-start">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-zinc-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 italic">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Waiting Total
              </span>
              <span className="text-4xl font-black font-mono text-white mt-2 leading-none tracking-tighter italic">
                {waitingList.length}
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 italic">
                <Award className="w-3.5 h-3.5 animate-bounce" /> {labels.memberShort}
              </span>
              <span className="text-4xl font-black font-mono text-amber-400 mt-2 leading-none tracking-tighter italic">
                {membersWaiting}
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-zinc-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 italic">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> {labels.publicShort}
              </span>
              <span className="text-4xl font-black font-mono text-emerald-400 mt-2 leading-none tracking-tighter italic">
                {publicWaiting}
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 italic">
                <CheckCircle2 className="w-3.5 h-3.5" /> Served
              </span>
              <span className="text-4xl font-black font-mono text-indigo-400 mt-2 leading-none tracking-tighter italic">
                {completedCount}
              </span>
            </div>
          </div>

          {/* Active Call / Counters Area */}
          <div className="bg-zinc-905 border border-zinc-800 rounded-3xl p-8 flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-2xl font-black text-white mb-6 tracking-tighter uppercase italic flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500" /> Live Counter Boards
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 flex-1">
              {state.counters.map(counter => {
                const currentServeItem = counter.currentServeId
                  ? state.items.find(i => i.id === counter.currentServeId)
                  : null;

                const isCalling = counter.status === 'calling';
                const isServing = counter.status === 'serving';

                return (
                  <div
                    key={counter.id}
                    id={`display-counter-${counter.id}`}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-500 ${
                      isCalling
                        ? 'border-emerald-500 bg-white text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/30'
                        : isServing
                          ? 'border-l-4 border-l-emerald-500 border-zinc-800 bg-zinc-900/90 text-white'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase tracking-widest italic ${isCalling ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {counter.name}
                        </span>
                        {counter.staffUsername ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest ${isCalling ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                            {counter.staffUsername}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-zinc-950 text-zinc-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest">
                            Offline
                          </span>
                        )}
                      </div>

                      {currentServeItem ? (
                        <div className="mt-6">
                          <span className={`text-xs font-bold block ${isCalling ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            Serving: <strong className={`font-black ${isCalling ? 'text-black' : 'text-white'}`}>{currentServeItem.name}</strong>
                          </span>
                          <span className={`text-6xl font-black tracking-tighter leading-none block mt-3 italic ${
                            isCalling 
                              ? 'text-black' 
                              : currentServeItem.type === 'member' 
                                ? 'text-amber-400' 
                                : 'text-emerald-400'
                          }`}>
                            {currentServeItem.ticketNumber}
                          </span>
                          <span className={`text-[9px] block mt-2 uppercase font-black tracking-widest ${
                            isCalling ? 'text-emerald-700 font-extrabold' : currentServeItem.type === 'member' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {currentServeItem.type === 'member' ? `💥 ${labels.memberShort.toUpperCase()}` : `✨ ${labels.publicShort.toUpperCase()} ATTENDEE`}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-8 mb-4 text-center">
                          <span className="text-zinc-600 text-sm font-black uppercase tracking-widest italic block">
                            Vacant Desk
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`mt-6 pt-4 border-t flex items-center gap-2 justify-end ${isCalling ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isCalling 
                          ? 'bg-emerald-500 animate-ping'
                          : isServing
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-zinc-700'
                      }`} />
                      <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isCalling ? 'text-zinc-650' : 'text-zinc-500'}`}>
                        {isCalling ? 'Calling Now' : isServing ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Hand: Join queue QR section (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-start">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
            
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest text-black bg-white rounded">
                <Smartphone className="w-3.5 h-3.5" /> ENTRY PORTAL
              </span>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none italic">Join Queue</h3>
              <p className="text-xs text-zinc-400 text-center max-w-xs leading-normal">
                Aim your phone camera at this QR code to sign in instantly. Real-time notifications pop up directly on your screen.
              </p>
            </div>

            {/* QR Wrapper */}
            <div id="qr-code-canvas-container" className="p-4 bg-white rounded-2xl border border-zinc-800 shadow-2xl transition-transform hover:scale-[1.02] duration-300">
              {qrCodeData ? (
                <img
                  src={qrCodeData}
                  alt="Join Queue QR Connection URL"
                  referrerPolicy="no-referrer"
                  className="w-56 h-56 rounded-lg pointer-events-none select-none"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs rounded-lg animate-pulse">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Manual Link Input */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold block">
                Direct phone link
              </span>
              <div 
                onClick={onNavigateToJoin}
                className="bg-black hover:bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl cursor-pointer select-all font-mono text-xs text-emerald-400 flex items-center justify-between"
              >
                <span className="truncate pr-2">{joinUrl}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Extra Instructions */}
            <div className="w-full border-t border-zinc-800 pt-6 text-left text-[11px] text-zinc-500 space-y-3 font-medium">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Dynamic prioritization list:</strong> Event organizer controls instant route changes based on ICC flow rules.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Carrier Cost-Free:</strong> Zero SMS bills. Direct lightweight websockets handle instant alert flashing.
                </span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer statistics */}
      <footer className="border-t border-zinc-800 bg-zinc-950/40 p-5 text-center text-zinc-650 text-[10px] font-mono flex items-center justify-between px-8">
        <div>Live Terminal Ingress State: Port 3000 Connected</div>
        <div className="uppercase italic tracking-wider font-extrabold text-zinc-500">Live Session #8821</div>
      </footer>
    </div>
  );
}
