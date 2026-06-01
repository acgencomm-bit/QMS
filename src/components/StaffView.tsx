import React, { useState } from 'react';
import { 
  Users, 
  LogIn, 
  LogOut, 
  Play, 
  RotateCw, 
  UserCheck, 
  XOctagon, 
  Clock, 
  Award, 
  Sparkles, 
  FileText,
  Sliders,
  TrendingUp,
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { QueueState, PriorityMode, QueueItem, getCategoryLabels, formatDob } from '../types';

interface StaffViewProps {
  state: QueueState;
  onLogin: (counterId: string, username: string, password?: string) => void;
  onLogout: (counterId: string) => void;
  onCallNext: (counterId: string) => void;
  onRecall: (counterId: string) => void;
  onComplete: (counterId: string) => void;
  onNoShow: (counterId: string) => void;
  onUpdatePriority: (mode: PriorityMode) => void;
  onResetQueue: () => void;
  onNavigateHome: () => void;
  onUpdateItemPriority: (itemId: string, priorityScore: number) => void;
}

export default function StaffView({
  state,
  onLogin,
  onLogout,
  onCallNext,
  onRecall,
  onComplete,
  onNoShow,
  onUpdatePriority,
  onResetQueue,
  onNavigateHome,
  onUpdateItemPriority,
}: StaffViewProps) {
  const labels = getCategoryLabels(state.categorySchema);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [overrideConfirmed, setOverrideConfirmed] = useState<boolean>(false);
  const [confirmResetState, setConfirmResetState] = useState<boolean>(false);
  const [autoAssignedForUser, setAutoAssignedForUser] = useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  // Find if currently logged in
  const [myCounterId, setMyCounterId] = useState<string>(() => {
    return localStorage.getItem('staff_counter_id') || '';
  });

  const myCounter = state.counters.find(c => c.id === myCounterId && c.staffUsername);

  const isFormDirty = () => {
    if (!myCounter) {
      return username.trim() !== '' || password.trim() !== '' || selectedCounterId !== '';
    }
    return false;
  };

  const handleHomeClick = () => {
    if (isFormDirty()) {
      setShowLeaveConfirm(true);
    } else {
      onNavigateHome();
    }
  };

  // Automatically assign pre-configured counter based on account details
  React.useEffect(() => {
    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser) {
      setAutoAssignedForUser('');
      return;
    }

    if (trimmedUser !== autoAssignedForUser) {
      const matchedAccount = state.accounts?.find(
        (a) => a.username.trim().toLowerCase() === trimmedUser
      );
      if (matchedAccount) {
        if (matchedAccount.assignedCounterId && matchedAccount.assignedCounterId !== 'any') {
          setSelectedCounterId(matchedAccount.assignedCounterId);
          setAutoAssignedForUser(trimmedUser);
        } else if (matchedAccount.assignedCounterId === 'any') {
          setAutoAssignedForUser(trimmedUser);
        }
      }
    }
  }, [username, state.accounts, autoAssignedForUser]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim()) {
      setLoginError('Please input a valid staff username.');
      return;
    }
    if (!password.trim()) {
      setLoginError('Please input your account password.');
      return;
    }
    if (!selectedCounterId) {
      setLoginError('Please select a physical Counter desk to run.');
      return;
    }

    // Check if counter is already claimed
    const existingClaim = state.counters.find(c => c.id === selectedCounterId);
    if (existingClaim && existingClaim.staffUsername) {
      if (!overrideConfirmed) {
        setLoginError(`Counter ${selectedCounterId} is currently active under user @${existingClaim.staffUsername}. Please check the "Force override active session" option below to assume control.`);
        return;
      }
    }

    // Call login callback to tell server
    localStorage.setItem('staff_counter_id', selectedCounterId);
    setMyCounterId(selectedCounterId);
    onLogin(selectedCounterId, username.trim(), password.trim());
  };

  const handleLogoutAction = () => {
    if (myCounterId) {
      onLogout(myCounterId);
      localStorage.removeItem('staff_counter_id');
      setMyCounterId('');
    }
  };

  // Lists filtered
  const waitingList = state.items.filter(item => item.status === 'waiting');
  
  // Sort waiting list accurately representing the visual queue hierarchy
  const getOrderedWaitingList = (): QueueItem[] => {
    // Group waiting items by priority score
    const groups: { [score: number]: QueueItem[] } = {};
    waitingList.forEach(item => {
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

    let orderedList: QueueItem[] = [];
    sortedScores.forEach(score => {
      const tierItems = groups[score];
      let sortedTier: QueueItem[] = [];

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

      orderedList = [...orderedList, ...sortedTier];
    });

    return orderedList;
  };

  const orderedWaitingList = getOrderedWaitingList();

  const historyList = state.items
    .filter(item => item.status === 'completed' || item.status === 'noshow')
    .sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))
    .slice(0, 15);

  const currentlyServingItem = myCounter?.currentServeId
    ? state.items.find(i => i.id === myCounter.currentServeId)
    : null;

  // Handle Reset safety state
  const handleResetQueueAction = () => {
    onResetQueue();
    setConfirmResetState(false);
  };

  // Staff Login Screen
  if (!myCounter) {
    const matchedAccount = username.trim()
      ? state.accounts?.find(a => a.username.trim().toLowerCase() === username.trim().toLowerCase())
      : null;

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center px-4 py-12 font-sans" id="staff-auth-gate">
        <div className="max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase text-black bg-white rounded">
              <Lock className="w-3.5 h-3.5" /> AGENT GATE
            </span>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Staff Login</h2>
            <p className="text-xs text-zinc-400">
              Claim a desk station and provide your agent initials to start calling live customer ticket numbers.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="staff-username-input" className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
                Staff Account Username
              </label>
              <input
                type="text"
                id="staff-username-input"
                placeholder="e.g. Operator1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-white focus:outline-none rounded-lg py-3 px-4 text-xs text-white placeholder-zinc-700 transition font-mono"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="staff-password-input" className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
                Staff Account Password
              </label>
              <input
                type="password"
                id="staff-password-input"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-white focus:outline-none rounded-lg py-3 px-4 text-xs text-white placeholder-zinc-700 transition font-mono"
                required
              />
            </div>

            {/* Counter Selector Button Group */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400 block">
                  Assign Desk Location
                </label>
                {matchedAccount ? (
                  matchedAccount.assignedCounterId && matchedAccount.assignedCounterId !== 'any' ? (
                    <span className="text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                      ✨ Auto-Assigned
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                      👐 Select Any Desk
                    </span>
                  )
                ) : username.trim() ? (
                  <span className="text-[9px] font-mono font-extrabold text-zinc-500 bg-zinc-950 border border-zinc-850 px-2.5 py-0.5 rounded uppercase tracking-wider">
                    ❓ Manual Selection
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {state.counters.map(c => {
                  const occupied = !!c.staffUsername;
                  const selected = selectedCounterId === c.id;

                  return (
                    <div
                      key={c.id}
                      id={`setup-counter-btn-${c.id}`}
                      onClick={() => setSelectedCounterId(c.id)}
                      className={`border rounded-lg p-3 cursor-pointer select-none text-center transition ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                          : occupied
                            ? 'border-rose-950 bg-rose-955/20 text-rose-400'
                            : 'border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:bg-zinc-950 hover:text-zinc-300'
                      }`}
                    >
                      <h4 className="text-xs font-black uppercase tracking-wider">{c.name}</h4>
                      {occupied && (
                        <p className="text-[9px] truncate font-mono mt-0.5" title={c.staffUsername || ''}>
                          ({c.staffUsername})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Occupied Counter Force Override Checkbox */}
            {selectedCounterId && state.counters.find(c => c.id === selectedCounterId)?.staffUsername && (
              <label className="flex items-start gap-2.5 bg-rose-500/5 hover:bg-rose-500/10 p-3 rounded border border-rose-500/20 text-[10px] text-rose-350 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={overrideConfirmed}
                  onChange={(e) => setOverrideConfirmed(e.target.checked)}
                  className="mt-0.5 shadow bg-zinc-950 focus:ring-0 cursor-pointer"
                />
                <span className="font-mono leading-snug text-neutral-300">
                  Force override active session for counter {selectedCounterId} currently claimed by <strong className="text-rose-400">@{state.counters.find(c => c.id === selectedCounterId)?.staffUsername}</strong>
                </span>
              </label>
            )}

            {loginError && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 border border-rose-500/20 rounded">
                {loginError}
              </p>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleHomeClick}
                className="w-1/3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold py-3.5 rounded text-xs uppercase tracking-widest transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-login-confirm"
                className="w-2/3 bg-white hover:bg-zinc-100 text-black font-black py-3.5 rounded text-xs transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest"
              >
                Claim Station <LogIn className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // Active Staff Dashboard Interface
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans" id="staff-serving-console">
      {/* Top Console Command Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white text-black font-black px-4 py-1.5 text-xl tracking-tighter uppercase italic">
            CON-DESK
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Live Station Controller
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Active: <strong className="text-emerald-400 font-black">{myCounter.staffUsername}</strong> &bull; <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded text-zinc-300 font-bold">{myCounter.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleHomeClick}
            className="text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800/80 transition cursor-pointer"
          >
            Lobby Dashboard
          </button>
          <button
            onClick={handleLogoutAction}
            id="btn-staff-logout"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-rose-450 hover:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded transition uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Station
          </button>
        </div>
      </header>

      {/* Main Console Roster Layout */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Serving Centerpiece & Rules Controls */}
        <div className="lg:col-span-8 space-y-6 flex flex-col justify-start">
          
          {/* Main Action Controller Card */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Current Caller Deck</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  myCounter.status === 'calling' 
                    ? 'bg-rose-500 animate-ping' 
                    : 'bg-emerald-400 animate-pulse'
                }`} />
                <span className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                  STATE: {myCounter.status}
                </span>
              </div>
            </div>

            {currentlyServingItem ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Column 1: Ticket Numbers */}
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-zinc-550 text-[10px] font-black uppercase tracking-wider">
                    Serving Ticket
                  </span>
                  <div className="text-6xl font-black font-sans tracking-tighter text-white italic leading-none">
                    {currentlyServingItem.ticketNumber}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase bg-zinc-955 px-2.5 py-0.5 rounded ${
                    currentlyServingItem.type === 'member' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {currentlyServingItem.type === 'member' ? `${labels.memberBadge.toUpperCase()}` : `${labels.publicBadge.toUpperCase()}`}
                  </span>
                </div>

                {/* Column 2: Name and Timestamp */}
                <div className="space-y-2 border-y md:border-y-0 md:border-x border-zinc-800 py-4 md:py-0 md:px-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Attendee name</span>
                    <strong className="text-xl text-white font-black tracking-tight truncate block uppercase">
                      {currentlyServingItem.name}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Called: {new Date(currentlyServingItem.calledAt || Date.now()).toLocaleTimeString()}
                    </div>
                    {currentlyServingItem.dobDay && currentlyServingItem.dobMonth && currentlyServingItem.dobYear && (
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        🎂 DOB: <span className="text-white font-extrabold">{formatDob(currentlyServingItem.dobDay, currentlyServingItem.dobMonth, currentlyServingItem.dobYear)}</span>
                      </div>
                    )}
                    {currentlyServingItem.phoneNumber && (
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        📞 PHONE: <span className="text-white font-extrabold">{currentlyServingItem.countryCode || ''} {currentlyServingItem.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {currentlyServingItem.status === 'arrived' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded uppercase tracking-wider animate-pulse">
                        ✓ On Their Way !
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded uppercase tracking-wider">
                        ⌛ Pending response
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 3: Active Serving Tools */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onRecall(myCounterId)}
                    id="btn-recall-attendee"
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded py-2.5 text-xs font-black border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    Recall / Flash Board
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onComplete(myCounterId)}
                      id="btn-complete-serve"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2.5 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Arrived
                    </button>
                    <button
                      onClick={() => onNoShow(myCounterId)}
                      id="btn-noshow-attendee"
                      className="bg-transparent hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-600 rounded py-2.5 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      No-Show
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center space-y-4 bg-zinc-950/20 rounded-xl border border-zinc-800/50">
                <Users className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-500 italic">No Active Attendee on your desk.</p>
                <button
                  onClick={() => onCallNext(myCounterId)}
                  id="btn-call-first"
                  className="px-6 py-3.5 bg-white hover:bg-zinc-100 text-black rounded text-xs font-black transition shadow-xl cursor-pointer inline-flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Request Next Ticket
                </button>
              </div>
            )}

            {currentlyServingItem && (
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end">
                <button
                  onClick={() => onCallNext(myCounterId)}
                  className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-black rounded text-xs font-black transition cursor-pointer flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Complete & Next
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Prioritisation Mode Selector */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Routing Rule Prioritization</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Mode 1: FIFO */}
              <div
                id="btn-priority-mode-fifo"
                onClick={() => onUpdatePriority('FIFO')}
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  state.priorityMode === 'FIFO'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-white">FIFO Standard</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  First-In, First-Out rule. Strict democratic order.
                </p>
              </div>

              {/* Mode 2: MEMBER_FIRST */}
              <div
                id="btn-priority-mode-members"
                onClick={() => onUpdatePriority('MEMBER_FIRST')}
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  state.priorityMode === 'MEMBER_FIRST'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-black text-amber-550 mb-0.5">
                  <Award className="w-3 h-3" /> {state.categorySchema === 'option2' ? '🇸🇬 LOCAL STATUS' : 'ROYAL ICC RULE'}
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {labels.memberShort} Priority
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  {labels.memberLabel} queue tickets are always called first until empty.
                </p>
              </div>

              {/* Mode 3: RATIO_3_1 */}
              <div
                id="btn-priority-mode-ratio-3"
                onClick={() => onUpdatePriority('RATIO_3_1')}
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  state.priorityMode === 'RATIO_3_1'
                    ? 'border-indigo-500 bg-indigo-505/10'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Ratio (3:1)</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Calls up to 3 {labels.memberShort} tickets consecutively, then 1 {labels.publicShort} ticket.
                </p>
              </div>

              {/* Mode 4: RATIO_2_1 */}
              <div
                id="btn-priority-mode-ratio-2"
                onClick={() => onUpdatePriority('RATIO_2_1')}
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  state.priorityMode === 'RATIO_2_1'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Ratio (2:1)</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Calls up to 2 {labels.memberShort} tickets consecutively, then 1 {labels.publicShort} ticket.
                </p>
              </div>

              {/* Mode 5: RATIO_PUBLIC_3_1 */}
              <div
                id="btn-priority-mode-ratio-public-3"
                onClick={() => onUpdatePriority('RATIO_PUBLIC_3_1')}
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  state.priorityMode === 'RATIO_PUBLIC_3_1'
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-white">{labels.publicShort} (3:1)</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Calls up to 3 {labels.publicShort} tickets consecutively, then 1 {labels.memberShort} ticket.
                </p>
              </div>
            </div>
          </div>

          {/* Active Counters Team Coordinator Panel */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Live Counters Map Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {state.counters.map(counter => {
                const serves = state.items.find(i => i.id === counter.currentServeId);
                const isActive = counter.id === myCounterId;

                return (
                  <div 
                    key={counter.id}
                    className={`p-4 rounded-lg border text-center transition ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-500/15'
                        : 'border-zinc-800 bg-zinc-950/60'
                    }`}
                  >
                    <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">{counter.name}</span>
                    <span className="text-xs font-black text-white block mt-0.5 truncate uppercase">
                      {counter.staffUsername || 'vacant'}
                    </span>
                    <span className={`text-base font-black font-mono block mt-2 ${
                      serves?.type === 'member' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {serves?.ticketNumber || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Waiting Queues Lists (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
          
          {/* Waiting Queue List Card */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-6 flex-1 flex flex-col min-h-[350px] shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Queue ({orderedWaitingList.length})
              </h2>
              <span className="text-[10px] bg-zinc-950 text-zinc-500 font-mono px-2 py-0.5 rounded font-black uppercase">
                Wait
              </span>
            </div>

            {/* Scrollable List wrapper */}
            <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-1 custom-scrollbar">
              {orderedWaitingList.length > 0 ? (
                orderedWaitingList.map((item, idx) => {
                  return (
                    <div 
                      key={item.id}
                      className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center transition hover:border-zinc-700 gap-3"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[90px] uppercase block" title={item.name}>{item.name}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                            item.type === 'member' ? 'bg-amber-550/20 text-amber-450 bg-amber-500/10' : 'bg-zinc-850 text-zinc-400'
                          }`}>
                            {item.type === 'member' ? (state.categorySchema === 'option2' ? 'SG' : 'ICC') : (state.categorySchema === 'option2' ? 'OUT' : 'PUB')}
                          </span>
                        </div>
                        {item.dobDay && item.dobMonth && item.dobYear && (
                          <span className="text-[9px] text-zinc-400 block font-mono">
                            🎂 {formatDob(item.dobDay, item.dobMonth, item.dobYear)}
                          </span>
                        )}
                        {item.phoneNumber && (
                          <span className="text-[9px] text-zinc-400 block font-mono">
                            📞 {item.countryCode || ''} {item.phoneNumber}
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-550 block font-mono">
                          Joined: {new Date(item.joinedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Manual Priority Level Controllers */}
                      <div className="flex items-center gap-2 px-1 hover:bg-zinc-900/50 rounded-lg p-1.5 border border-zinc-900/40 transition shrink-0 bg-zinc-900/10">
                        <button
                          id={`btn-decrement-priority-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateItemPriority(item.id, (item.priorityScore || 0) - 1);
                          }}
                          className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:bg-zinc-800 flex items-center justify-center font-black text-zinc-400 hover:text-white text-xs select-none cursor-pointer"
                          title="Decrease priority level"
                        >
                          -
                        </button>
                        
                        <div className="text-center min-w-[40px] leading-tight select-none">
                          <span className="text-[8px] text-zinc-500 font-mono block uppercase font-bold">Tier</span>
                          <span className={`text-[11px] font-black font-mono block leading-none mt-0.5 ${
                            (item.priorityScore || 0) > 0 
                              ? 'text-amber-400 font-extrabold animate-pulse'
                              : (item.priorityScore || 0) < 0
                                ? 'text-zinc-600'
                                : 'text-zinc-450'
                          }`}>
                            {(item.priorityScore || 0) > 0 ? `+${item.priorityScore}` : item.priorityScore || 0}
                          </span>
                        </div>

                        <button
                          id={`btn-increment-priority-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateItemPriority(item.id, (item.priorityScore || 0) + 1);
                          }}
                          className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:bg-zinc-800 flex items-center justify-center font-black text-emerald-400 hover:text-emerald-300 text-xs select-none cursor-pointer"
                          title="Increase priority level"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <strong className="text-sm font-black font-mono text-emerald-400 block">{item.ticketNumber}</strong>
                        <span className="text-[8px] text-zinc-550 block font-black uppercase">Pos: #{idx + 1}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center py-12 space-y-2">
                  <Users className="w-8 h-8 text-zinc-800" />
                  <p className="text-xs text-zinc-650 font-black uppercase tracking-wider italic">No clients waiting. All clear!</p>
                </div>
              )}
            </div>
          </div>

          {/* Serve History Dashboard */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-6 max-h-[250px] flex flex-col justify-between shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-3 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" /> Log History (15x)
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[160px]">
              {historyList.length > 0 ? (
                historyList.map(item => {
                  const completed = item.status === 'completed';

                  return (
                    <div 
                      key={item.id}
                      className="bg-zinc-950 px-3 py-2.5 rounded flex items-center justify-between text-xs border border-zinc-805"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${completed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono text-zinc-300 font-bold">{item.ticketNumber}</span>
                        <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[80px]">({item.name})</span>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-wider font-mono ${completed ? 'text-emerald-500' : 'text-rose-550'}`}>
                        {completed ? 'Served' : 'Aborted'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-zinc-650 font-black uppercase tracking-wider text-center italic py-4">No logged records empty.</p>
              )}
            </div>
          </div>

          {/* Dangerous Zone Reset tools */}
          <div className="bg-rose-950/10 border border-rose-950 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="space-y-0.5 self-start md:self-auto">
              <h3 className="text-xs font-black uppercase text-rose-500 tracking-wider">Flush Queue Hub</h3>
              <p className="text-[9px] text-zinc-500 max-w-[200px] leading-normal font-medium">Reset all active cards, counters, and ticketing sequences.</p>
            </div>
            
            {!confirmResetState ? (
              <button
                onClick={() => setConfirmResetState(true)}
                id="btn-admin-reset-prep"
                className="w-full md:w-auto px-4 py-2.5 bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 border border-rose-500/15 font-black rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Queue
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded border border-rose-500/20">
                <span className="text-[9px] text-rose-400 font-mono font-bold uppercase px-1">Are you sure?</span>
                <button
                  onClick={handleResetQueueAction}
                  id="btn-admin-reset-confirm"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] uppercase font-black tracking-wider transition cursor-pointer font-mono"
                >
                  Yes, Flush
                </button>
                <button
                  onClick={() => setConfirmResetState(false)}
                  id="btn-admin-reset-cancel"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded text-[10px] uppercase font-black tracking-wider transition cursor-pointer font-mono"
                >
                  No
                </button>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Roster footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 p-5 text-center text-zinc-650 text-[10px] font-mono flex items-center justify-between px-8">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" /> 
          Rule priority mode: <span className="text-white uppercase font-black">{state.priorityMode}</span>
        </div>
        <div>Sync hub: port 3000 secure websocket live connection</div>
      </footer>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in text-white font-sans">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">Discard Logons?</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
              You are currently filling in Operator credentials or selecting physical counters. If you leave, your inputs will be cleared. Do you want to stay, or discard inputs and return to lobby?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                type="button"
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-755 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                Keep Editing
              </button>
              <button
                onClick={onNavigateHome}
                type="button"
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer font-sans shadow-lg"
              >
                Discard & Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
