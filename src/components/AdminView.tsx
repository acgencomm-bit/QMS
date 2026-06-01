import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Key, 
  Plus, 
  Trash2, 
  Home, 
  Users, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  Settings, 
  X,
  RefreshCw,
  AlertCircle,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Info,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { QueueState, StaffAccount, getCategoryLabels } from '../types';

interface AdminViewProps {
  state: QueueState;
  onNavigateHome: () => void;
  onAddAccount: (username: string, password: string, assignedCounterId: string) => void;
  onDeleteAccount: (username: string) => void;
  onUpdateAccount: (username: string, newUsername: string, password: string, assignedCounterId: string) => void;
  onResetQueue: () => void;
  onUpdateCategorySchema?: (schema: 'option1' | 'option2') => void;
}

export default function AdminView({
  state,
  onNavigateHome,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccount,
  onResetQueue,
  onUpdateCategorySchema
}: AdminViewProps) {
  // Simple password check to access admin view (value: 'admin')
  const [adminAuthKey, setAdminAuthKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_authenticated') === 'true';
  });
  const [authError, setAuthError] = useState<string>('');

  // Form states for creating new attendee account
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newCounterId, setNewCounterId] = useState<string>('any');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Form states for modifying an existing account
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editUsernameInput, setEditUsernameInput] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editCounterId, setEditCounterId] = useState<string>('any');
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  const labels = getCategoryLabels(state.categorySchema);

  const isFormDirty = () => {
    if (!isAuthenticated) {
      return adminAuthKey.trim() !== '';
    }
    return (
      newUsername.trim() !== '' ||
      newPassword.trim() !== '' ||
      newCounterId !== 'any' ||
      editingUsername !== null
    );
  };

  const handleHomeClick = () => {
    if (isFormDirty()) {
      setShowLeaveConfirm(true);
    } else {
      onNavigateHome();
    }
  };

  // Toggle visible passwords
  const [showPasswords, setShowPasswords] = useState<{ [username: string]: boolean }>({});

  // Reset confirmation & notification states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetFinishedAlert, setResetFinishedAlert] = useState(false);

  // Efficiency metrics helper calculations
  const totalTickets = state.items?.length || 0;
  const iccTickets = state.items?.filter(item => item.type === 'member').length || 0;
  const publicTickets = totalTickets - iccTickets;

  const completedTickets = state.items?.filter(item => item.status === 'completed') || [];
  const noshowTickets = state.items?.filter(item => item.status === 'noshow') || [];
  const waitingTickets = state.items?.filter(item => item.status === 'waiting') || [];
  const currentlyCalledState = state.items?.filter(item => item.status === 'called' || item.status === 'arrived') || [];

  // Average wait time for served/called tickets
  const servedOrCalledItems = state.items?.filter(item => item.calledAt !== null) || [];
  const avgWaitMs = servedOrCalledItems.length > 0
    ? servedOrCalledItems.reduce((acc, curr) => acc + ((curr.calledAt || 0) - curr.joinedAt), 0) / servedOrCalledItems.length
    : 0;
  const avgWaitSec = Math.round(avgWaitMs / 1000);

  // Average attendee acknowledgement delay
  const acknowledgedItems = state.items?.filter(item => item.acknowledgedAt !== null && item.calledAt !== null) || [];
  const avgAcknowledgeMs = acknowledgedItems.length > 0
    ? acknowledgedItems.reduce((acc, curr) => acc + ((curr.acknowledgedAt || 0) - (curr.calledAt || 0)), 0) / acknowledgedItems.length
    : 0;
  const avgAcknowledgeSec = Math.round(avgAcknowledgeMs / 1000);

  const downloadJSON = () => {
    const reportData = {
      eventTitle: "V-QUEUE Efficiency Analytics Report",
      downloadedAt: new Date().toISOString(),
      summaryStats: {
        totalTickets,
        iccTickets,
        publicTickets,
        completedCount: completedTickets.length,
        noshowCount: noshowTickets.length,
        waitingCount: waitingTickets.length,
        activeCallingCount: currentlyCalledState.length,
        averageWaitSeconds: avgWaitSec,
        averageAcknowledgeSeconds: avgAcknowledgeSec
      },
      staffRoster: state.accounts || [],
      countersState: state.counters || [],
      queueItems: state.items || []
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v_queue_analytics_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = [
      'Ticket Number',
      'Attendee Name',
      'Attendee Type',
      'Date of Birth',
      'Country Code',
      'Phone Number',
      'Current Status',
      'Assigned Desk',
      'Joined Time',
      'Called Time',
      'Acknowledged Time',
      'Wait Duration (s)',
      'Response Duration (s)',
      'Priority Score'
    ];

    const rows = (state.items || []).map(item => {
      const waitTimeSec = item.calledAt ? Math.max(0, Math.round((item.calledAt - item.joinedAt) / 1000)) : '';
      const responseTimeSec = (item.acknowledgedAt && item.calledAt) ? Math.max(0, Math.round((item.acknowledgedAt - item.calledAt) / 1000)) : '';
      const dobStr = item.dobDay && item.dobMonth && item.dobYear
        ? `${item.dobYear}-${String(item.dobMonth).padStart(2, '0')}-${String(item.dobDay).padStart(2, '0')}`
        : 'N/A';

      return [
        item.ticketNumber,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        item.type === 'member' ? 'ICC' : 'Public',
        dobStr,
        `"${(item.countryCode || '').replace(/"/g, '""')}"`,
        `"${(item.phoneNumber || '').replace(/"/g, '""')}"`,
        item.status.toUpperCase(),
        item.calledByCounter || 'Unassigned',
        new Date(item.joinedAt).toLocaleString(),
        item.calledAt ? new Date(item.calledAt).toLocaleString() : 'N/A',
        item.acknowledgedAt ? new Date(item.acknowledgedAt).toLocaleString() : 'N/A',
        waitTimeSec,
        responseTimeSec,
        item.priorityScore || 0
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v_queue_efficiency_spreadsheet_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFullReset = () => {
    onResetQueue();
    setShowResetConfirm(false);
    setResetFinishedAlert(true);
    setTimeout(() => setResetFinishedAlert(false), 4000);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (adminAuthKey.trim() === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('is_admin_authenticated', 'true');
    } else {
      setAuthError('Access Denied: Invalid Administrator key.');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_admin_authenticated');
  };

  const toggleShowPassword = (user: string) => {
    setShowPasswords(prev => ({ ...prev, [user]: !prev[user] }));
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const formattedUser = newUsername.trim();
    if (!formattedUser) {
      setFormError('Please enter a username.');
      return;
    }
    if (formattedUser.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (!newPassword) {
      setFormError('Please enter a password.');
      return;
    }

    // Check duplicate
    const exists = state.accounts?.some(acc => acc.username.toLowerCase() === formattedUser.toLowerCase());
    if (exists) {
      setFormError(`An account with username "${formattedUser}" already exists.`);
      return;
    }

    onAddAccount(formattedUser, newPassword, newCounterId);
    setFormSuccess(`Staff account "${formattedUser}" successfully deployed!`);
    setNewUsername('');
    setNewPassword('');
    setNewCounterId('any');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  const handleStartEdit = (acc: StaffAccount) => {
    setFormError('');
    setEditingUsername(acc.username);
    setEditUsernameInput(acc.username);
    setEditPassword(acc.password);
    setEditCounterId(acc.assignedCounterId);
  };

  const handleSaveEdit = () => {
    if (!editingUsername) return;
    const trimmedNewUser = editUsernameInput.trim();
    if (!trimmedNewUser) {
      setFormError('Username cannot be empty.');
      return;
    }
    if (trimmedNewUser.length < 3) {
      setFormError('Username must be at least 3 characters.');
      return;
    }
    if (!editPassword.trim()) {
      setFormError('Password cannot be empty.');
      return;
    }
    // Check duplication with other accounts
    const exists = state.accounts?.some(acc => 
      acc.username.toLowerCase() !== editingUsername.toLowerCase() && 
      acc.username.toLowerCase() === trimmedNewUser.toLowerCase()
    );
    if (exists) {
      setFormError(`An account with username "${trimmedNewUser}" already exists.`);
      return;
    }
    onUpdateAccount(editingUsername, trimmedNewUser, editPassword.trim(), editCounterId);
    setEditingUsername(null);
  };

  const handleDeleteClick = (user: string) => {
    setDeletingUsername(user);
  };

  const handleConfirmDelete = (user: string) => {
    onDeleteAccount(user);
    setDeletingUsername(null);
  };

  // If not authenticated, render standard elegant administrative guard door
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans relative" id="admin-gate-screen">
        {/* Abstract Background Design Element */}
        <div className="absolute inset-0 bg-red-950/5 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-red-550/5 animate-pulse absolute" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 mb-2">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">V-QUEUE Settings</h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Access the administrative workstation to assign staff credentials & counter desks.
            </p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider block mb-1.5">
                Administrator Authorization Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Authorization Key"
                  value={adminAuthKey}
                  onChange={(e) => setAdminAuthKey(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-500 transition text-center font-mono placeholder:text-zinc-700"
                  required
                />
              </div>
              {authError && (
                <p className="text-red-400 text-xs mt-2 font-medium flex items-center gap-1.5 justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              Verify Key
            </button>
          </form>

          <button
            onClick={handleHomeClick}
            className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition uppercase tracking-wider cursor-pointer"
          >
            ← Cancel & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans" id="admin-workstation">
      {/* Header */}
      <header className="border-b border-zinc-850 bg-zinc-950/80 backdrop-blur px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-black font-black px-3.5 py-1 text-xl tracking-tighter uppercase italic">
            ADMIN
          </div>
          <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase font-bold hidden sm:inline">
            Credential Workstation
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogoutAdmin}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded uppercase tracking-wider transition"
          >
            Lock Terminal
          </button>
          
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-black font-black rounded uppercase tracking-wider transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Home Screen
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Control Column: Add New Account */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Event Configuration Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-indigo-400" /> Event configuration
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Configure the participant registration scheme for this event. Toggling dynamically changes inputs, ticket labels, and priorities in real-time.
            </p>

            <div className="space-y-3.5">
              <div 
                onClick={() => onUpdateCategorySchema && onUpdateCategorySchema('option1')}
                className={`border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between items-start ${
                  (state.categorySchema || 'option1') === 'option1'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-800 bg-black/40 hover:bg-black/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-black px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-400">
                    OPTION 1
                  </span>
                  <span className="text-xs font-bold text-white">Public & ICC Member</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                  Attendees choose between <strong>Public Pass</strong> or <strong>ICC Member</strong>. ICC Members receive priority queuing.
                </p>
              </div>

              <div 
                onClick={() => onUpdateCategorySchema && onUpdateCategorySchema('option2')}
                className={`border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between items-start ${
                  state.categorySchema === 'option2'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-black/40 hover:bg-black/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-black px-1.5 py-0.5 rounded bg-amber-955 border border-amber-500/30 text-amber-500">
                    OPTION 2
                  </span>
                  <span className="text-xs font-bold text-white">Singapore Resident</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                  Attendees choose between <strong>Located in Singapore</strong> or <strong>Located outside of Singapore</strong>. Singapore residents receive priority.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-emerald-400" /> Deploy New Staff
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Register a unique username & password, and lock their session to a specific desk counter or allow generic floating logons.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4 pt-1">
              {formError && (
                <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500 block">
                  Staff Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. counter_clerk_1"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500 block">
                  Staff Access Password
                </label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500 block">
                  Counter Assginment Desk
                </label>
                <select
                  value={newCounterId}
                  onChange={(e) => setNewCounterId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono cursor-pointer"
                >
                  <option value="any">Floating Counter (Any counter Desk)</option>
                  <option value="1">Counter 1</option>
                  <option value="2">Counter 2</option>
                  <option value="3">Counter 3</option>
                  <option value="4">Counter 4</option>
                  <option value="5">Counter 5</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 leading-none shadow-lg mt-3"
              >
                Create Credentials Account
              </button>
            </form>
          </div>

          {/* Post-Event Analytics Workstation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 font-black uppercase tracking-tighter">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg text-white font-black uppercase italic">
                Event Analytics Hub
              </h2>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export comprehensive record logs containing every attendee claim, timestamps, and routing durations to audit event operations.
            </p>

            {/* Quick Efficiency Summary Stats */}
            <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 border border-zinc-800/80 rounded-xl">
              <div>
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">Total Tickets</span>
                <span className="text-base font-black font-mono tracking-tight text-white">{totalTickets}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">{labels.memberShort}</span>
                <span className="text-base font-black font-mono tracking-tight text-amber-500">{iccTickets}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">Avg Wait</span>
                <span className="text-base font-black font-mono tracking-tight text-emerald-400">{avgWaitSec}s</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">Response Delay</span>
                <span className="text-base font-black font-mono tracking-tight text-zinc-300">{avgAcknowledgeSec}s</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={downloadCSV}
                className="w-full bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-700 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-zinc-700/50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Download CSV Spreadsheet
              </button>

              <button
                onClick={downloadJSON}
                className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-350 hover:text-white font-bold uppercase tracking-wider text-[10px] py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-zinc-850"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Raw JSON Analytics
              </button>
            </div>
          </div>

          {/* Danger Zone: Reset Workspace */}
          <div className="bg-zinc-900 border border-red-500/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 font-black uppercase tracking-tighter">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="text-lg text-red-500 italic block">
                Post-Event Reset
              </h2>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Flush all active/served queue history, reset counters to idle, clear active ticket views, and reset ticketing sequence IDs for a future event.
            </p>

            {resetFinishedAlert && (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Event workspace successfully reset.</span>
              </div>
            )}

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-red-950/20 hover:bg-red-950/40 text-red-405 hover:text-red-300 border border-red-500/15 font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Prepare Full Reset
              </button>
            ) : (
              <div className="bg-black/60 p-4 border border-red-950/60 rounded-xl space-y-3 px-3">
                <p className="text-[10px] text-red-300 leading-normal font-mono uppercase">
                  ⚠️ This will instantly wipe all active/past tickets and reset registration seeds!
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleFullReset}
                    type="button"
                    className="flex-1 bg-red-650 hover:bg-red-650/90 active:bg-red-750 text-white font-black uppercase tracking-wider text-[10px] py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    type="button"
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider text-[10px] py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database List of Current Accounts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="space-y-1">
                <h2 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400" /> Active Staff Accounts
                </h2>
                <p className="text-xs text-zinc-550">
                  Manage the current staff registry of credentials configured to operate counter boards.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-zinc-850 text-zinc-400 border border-zinc-800/80 font-bold uppercase tracking-widest">
                Totals: {(state.accounts || []).length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-3 px-2">Staff Username</th>
                    <th className="py-3 px-2">Assigned Desk</th>
                    <th className="py-3 px-2">Passphrase Key</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {(!state.accounts || state.accounts.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-650 italic font-mono uppercase">
                        No registered staff accounts.
                      </td>
                    </tr>
                  ) : (
                    state.accounts.map((acc) => {
                      const isEditing = editingUsername === acc.username;

                      return (
                        <tr key={acc.username} className="hover:bg-zinc-950/20 transition">
                          {/* Username */}
                          <td className="py-3.5 px-2 font-bold text-white uppercase tracking-tight">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editUsernameInput}
                                onChange={(e) => setEditUsernameInput(e.target.value)}
                                className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono w-28 uppercase"
                                required
                              />
                            ) : (
                              acc.username
                            )}
                          </td>

                          {/* Desktop assignment dropdown or label */}
                          <td className="py-3.5 px-2">
                            {isEditing ? (
                              <select
                                value={editCounterId}
                                onChange={(e) => setEditCounterId(e.target.value)}
                                className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                              >
                                <option value="any">Floating</option>
                                <option value="1">Counter 1</option>
                                <option value="2">Counter 2</option>
                                <option value="3">Counter 3</option>
                                <option value="4">Counter 4</option>
                                <option value="5">Counter 5</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono tracking-widest ${
                                acc.assignedCounterId === 'any' 
                                  ? 'bg-zinc-800 text-zinc-300' 
                                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30'
                              }`}>
                                {acc.assignedCounterId === 'any' ? 'FLOATING (ANY)' : `COUNTER ${acc.assignedCounterId}`}
                              </span>
                            )}
                          </td>

                          {/* Password viewer or editor */}
                          <td className="py-3.5 px-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono w-24"
                                required
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-emerald-400 select-all font-bold">
                                  {showPasswords[acc.username] ? acc.password : '••••••'}
                                </span>
                                <button
                                  onClick={() => toggleShowPassword(acc.username)}
                                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition"
                                  title="Toggle passphrase visibility"
                                >
                                  {showPasswords[acc.username] ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Action Controllers */}
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {deletingUsername === acc.username ? (
                                <div className="flex items-center gap-1 bg-red-950/30 p-1 rounded border border-red-500/20">
                                  <span className="text-[9px] text-red-400 font-mono font-bold uppercase px-1">Confirm?</span>
                                  <button
                                    onClick={() => handleConfirmDelete(acc.username)}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[8px] uppercase font-black tracking-wider transition font-mono"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeletingUsername(null)}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[8px] uppercase font-black tracking-wider transition font-mono"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-500/10 text-emerald-400 font-mono font-black uppercase text-[10px] tracking-wider transition border border-emerald-500/20"
                                    disabled={!editPassword.trim()}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingUsername(null)}
                                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-400 font-mono text-[10px]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(acc)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition rounded mr-1 text-[10px] uppercase font-bold px-2 py-1 bg-zinc-850"
                                  >
                                    Modify
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(acc.username)}
                                    className="p-1.5 text-zinc-550 hover:text-red-400 hover:bg-red-950/20 transition rounded"
                                    title="Delete account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 border-t border-zinc-800/80 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>* Floaters can log onto Counter desk 1-5 without lockups.</span>
              <span>Updated live over WS</span>
            </div>
          </div>
        </div>

      </main>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in text-white font-sans">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">Discard Edits?</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
              You have active form edits or unsaved staff configurations. If you leave, your draft inputs will be dropped. Do you want to stay in admin mode, or discard and return home?
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
                className="flex-1 py-3 bg-red-650 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer font-sans shadow-lg"
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
