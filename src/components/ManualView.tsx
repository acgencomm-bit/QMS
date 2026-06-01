import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  User, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Smartphone, 
  Tv, 
  Sliders, 
  Clock, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { QueueState } from '../types';

// Paths of the generated illustration mockups
const userManualImg = "/src/assets/images/manual_user_view_1780279179541.png";
const staffManualImg = "/src/assets/images/manual_staff_view_1780279198831.png";
const adminManualImg = "/src/assets/images/manual_admin_view_1780279219670.png";

interface ManualViewProps {
  state: QueueState;
  onNavigateHome: () => void;
}

export default function ManualView({ state, onNavigateHome }: ManualViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'staff' | 'admin'>('users');
  
  // Passcode verification states for Staff & Admin sections
  const [staffPasscode, setStaffPasscode] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isStaffUnlocked, setIsStaffUnlocked] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showStaffPass, setShowStaffPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const handleStaffUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    if (staffPasscode.trim() === 'admin') {
      setIsStaffUnlocked(true);
      setStaffPasscode('');
    } else {
      setStaffError('Access Denied: Invalid Administrative key.');
    }
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (adminPasscode.trim() === 'admin') {
      setIsAdminUnlocked(true);
      setAdminPasscode('');
    } else {
      setAdminError('Access Denied: Invalid Administrative key.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans" id="manual-root">
      {/* Upper Navigation bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            id="btn-manual-back-home"
            className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer flex items-center justify-center border border-zinc-850"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-black uppercase tracking-tight italic">
              V-QUEUE USER MANUAL
            </h1>
          </div>
          <span className="text-[9px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded bg-indigo-950 border border-indigo-505/30 text-indigo-400">
            Self-Service Hub
          </span>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs text-zinc-400 hover:text-white transition font-mono border border-zinc-800 hover:border-zinc-700 bg-black/40 px-3.5 py-1.5 rounded-lg"
        >
          Return to Dashboard
        </button>
      </header>

      {/* Manual Layout columns */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Navigation Links & Table of Contents */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold block mb-1">
              Select User Role
            </span>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between transition text-xs uppercase tracking-wider ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-zinc-950/50 hover:bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Guest Attendees
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-black/25 text-white/80 rounded uppercase font-mono">
                  Public
                </span>
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between transition text-xs uppercase tracking-wider ${
                  activeTab === 'staff'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-zinc-950/50 hover:bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isStaffUnlocked ? <Unlock className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Lock className="w-4 h-4" />}
                  Staff Operators
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                  isStaffUnlocked ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-zinc-550'
                }`}>
                  {isStaffUnlocked ? 'Unlocked' : 'Secure'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between transition text-xs uppercase tracking-wider ${
                  activeTab === 'admin'
                    ? 'bg-red-650 text-white shadow-lg'
                    : 'bg-zinc-950/50 hover:bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isAdminUnlocked ? <Unlock className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Lock className="w-4 h-4" />}
                  Administrator
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                  isAdminUnlocked ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-zinc-550'
                }`}>
                  {isAdminUnlocked ? 'Unlocked' : 'Secure'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Context Notes */}
          <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl text-[11px] text-zinc-400 space-y-3 leading-relaxed">
            <h3 className="font-extrabold uppercase text-white tracking-wider flex items-center gap-1.5 text-xs">
              <Activity className="w-4 h-4 text-emerald-400" /> APP QUICK METRICS
            </h3>
            <p>
              This V-QUEUE digital ticket system handles live updates instantly 
              and displays real-time calling animations without needing a refresh.
            </p>
            <div className="border-t border-zinc-800/60 pt-3 flex flex-col gap-1 font-mono text-[10px] text-zinc-500">
              <div>Version: 2.1.0-TS</div>
              <div>Sub-Systems: WebSockets enabled</div>
              <div>Access Token: Session-linked</div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="md:col-span-9 space-y-6">
          
          {/* Option 1: Guest Attendee Tab */}
          {activeTab === 'users' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8 animate-fade-in">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono px-2 py-1 bg-indigo-950 text-indigo-400 rounded-md border border-indigo-500/20 font-black">
                  ROLE: GUEST ATTENDEE / VISITOR
                </span>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  Self-Sufficient Queue Booking Guide
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                  Getting registered for a queue ticket is fully automated and takes less than 30 seconds. No passwords are required for guests.
                </p>
              </div>

              {/* Main Screenshot card */}
              <div className="bg-black/65 border border-zinc-855 rounded-2xl p-4 overflow-hidden shadow-2xl">
                <img 
                  src={userManualImg} 
                  alt="Attendee Screen Mockup" 
                  referrerPolicy="no-referrer"
                  className="rounded-lg w-full max-h-[380px] object-cover hover:scale-[1.01] transition duration-300" 
                />
                <span className="text-[9px] font-mono text-zinc-550 block text-center mt-3 uppercase tracking-widest">
                  Figure 1.1: Standard Mobile Register & Live Active Tracking screen
                </span>
              </div>

              {/* Step by Step Breakdown */}
              <div className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-tight text-white border-b border-zinc-800 pb-2">
                  Step-by-step Instructions for Visitors
                </h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-black uppercase text-white">Scan the QR Code</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      At the main display kiosk, take out your smart phone and align your camera with the generated QR code. You can also tap the link to join directly. No registration fees apply.
                    </p>
                  </div>

                  <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-black uppercase text-white">Submit Details</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Enter your <strong>Full Name</strong>, select your priority status, pick your <strong>Date of Birth</strong>, select your <strong>Country Code</strong>, and enter your <strong>Phone Number</strong>. Ensure these are correct so staff can identify you.
                    </p>
                  </div>

                  <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-xs font-black uppercase text-white">Monitor Live Ticket Status</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Upon submission, a live-tracking ticket details dashboard will appear. Your phone will displays exactly how many attendees are waiting in front of you. DO NOT close this browser tab as it links to your session.
                    </p>
                  </div>

                  <div className="space-y-2 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                        4
                      </span>
                      <h4 className="text-xs font-black uppercase text-white">Proceed to Desk Counter</h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      When your number lights up green with an audible chime, a high-contrast modal flashes on your screen with your counter map location. Immediately tap <strong>"I am on my way"</strong> and proceed to the designated desk.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2">
                  Frequently Asked Questions (Guest FAQ)
                </h3>
                <div className="space-y-2.5">
                  <div className="text-xs">
                    <p className="font-bold text-white">Q: I closed my browser tab, can I recover my ticket status?</p>
                    <p className="text-zinc-400 mt-1">A: Yes! Simply re-open the web application. The system securely persists your current session token in localized browser memory and automatically redirects you directly to your active calling ticket.</p>
                  </div>
                  <div className="text-xs border-t border-zinc-850/50 pt-2.5">
                    <p className="font-bold text-white">Q: Why did someone with a higher ticket number register after me get called first?</p>
                    <p className="text-zinc-400 mt-1">A: The system implements smart priority groups (e.g., ICC Members / Singapore Residents receive instant prioritization according to the current administrative queue rule). Priority queues reside in separate automated streams called before general public ones.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Option 2: Staff Operator Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Authenticator barrier if locked */}
              {!isStaffUnlocked ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-550/30 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-500" />
                  </div>
                  
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-black text-white uppercase italic">Staff Manual Securiground</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Access to the operator walkthrough requires administrative authentication. Enter the standard authorization key to view.
                    </p>
                  </div>

                  <form onSubmit={handleStaffUnlock} className="w-full max-w-sm space-y-4">
                    {staffError && (
                      <div className="text-[11px] font-medium bg-red-950/40 text-red-300 border border-red-500/20 rounded-lg p-3 text-left flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{staffError}</span>
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type={showStaffPass ? "text" : "password"}
                        placeholder="Enter Administrative Authorization Key"
                        value={staffPasscode}
                        onChange={(e) => setStaffPasscode(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 pl-4 pr-11 text-xs focus:outline-none focus:border-amber-500 transition font-mono text-center placeholder:text-zinc-700"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPass(p => !p)}
                        className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white"
                      >
                        {showStaffPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      id="btn-staff-unlock"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl py-3 cursor-pointer transition shadow-lg"
                    >
                      Authenticate Access
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8 animate-fade-in">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-1 bg-amber-950 text-amber-500 rounded-md border border-amber-500/20 font-black">
                        ROLE: STAFF SERVICE AGENT
                      </span>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Operator Workspace Console Guide
                      </h2>
                    </div>

                    <button
                      onClick={() => setIsStaffUnlocked(false)}
                      className="text-[10px] font-mono font-black uppercase bg-zinc-950 hover:bg-zinc-800 border border-zinc-805 text-zinc-400 hover:text-zinc-300 rounded-lg px-3 py-1.5 transition"
                    >
                      Lock Section
                    </button>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                    Service operators use the staff view to call, recall, complete, or mark customers as a no-show. It provides an intuitive real-time timeline stream showing every visitor.
                  </p>

                  {/* Generated Staff View Screenshot */}
                  <div className="bg-black/65 border border-zinc-855 rounded-2xl p-4 overflow-hidden shadow-2xl">
                    <img 
                      src={staffManualImg} 
                      alt="Staff Station Console Mockup" 
                      referrerPolicy="no-referrer"
                      className="rounded-lg w-full max-h-[380px] object-cover hover:scale-[1.01] transition duration-300" 
                    />
                    <span className="text-[9px] font-mono text-zinc-550 block text-center mt-3 uppercase tracking-widest">
                      Figure 2.1: Live Counter Staff control board, service terminal, status dashboard and queues listing
                    </span>
                  </div>

                  {/* Core Operation Sections */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white border-b border-zinc-800 pb-2">
                      Executing Everyday Desk Calls
                    </h3>

                    <div className="space-y-4">
                      
                      <div className="flex gap-4 items-start bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                        <span className="bg-amber-500 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white uppercase">Logging In</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            An operator chooses their assigned service desk number (e.g. Counter 1, Counter 2, etc.) and types their credential username and password (which are created in the Administrator Configuration view).
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                        <span className="bg-amber-500 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white uppercase">Calling the Next Ticket</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            Clicking the <strong>"CALL NEXT"</strong> button queries the queue algorithm in real-time, instantly fetching the highest priority token. The visitor's number flashes emerald on the master display and their device receives a loud chiming buzz notifier.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                        <span className="bg-amber-500 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white uppercase">Awaiting Visitor Arrival</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            While the attendee is walking over, the counter state remains <strong>"Calling..."</strong>. Once they arrive, they click "I have arrived" on their screen, which automatically advances your console status to <strong>"Active Service"</strong>. Alternatively, you can click <strong>"RECALL"</strong> to flash the signal again if they're distracted.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                        <span className="bg-amber-500 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          4
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white uppercase">Completing or Flagging Absence</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                            Once served, click <strong>"COMPLETE"</strong> to log the transaction. If the ticket owner fails to show up after multiple reminders, click <strong>"NO SHOW"</strong> to drop the ticket out of the queue database.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Staff Features Glossary */}
                  <div className="space-y-6 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-3">
                      Staff Console Detailed Features Glossary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">🔑 Desk Authenticator logon</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Secure entry portal binding an operator session to an assigned desk (e.g. Counter 3). Ensures and logs individual server responsibility. Handles floating sessions when allowed by the Admin.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">🟢 "Call Next" Button</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          The main driver tool of the console. Queries the active database utilizing selected sorting rules (FIFO, Priority, or dynamic ratios) to retrieve and highlight the next most critical attendee.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">📣 "Recall" Action Control</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Sends another visual flash to the main public monitor, triggers a secondary buzz, and replays the chime on the attendee's personal phone screen in case they missed the original desk call.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">🏢 "Arrive / Servicing" Status Link</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Detects live WebSocket ping when the attendee taps "I have arrived" upon sitting down, automatically transitioning operational logs from "Calling" straight into "Active Service".
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">✔️ "Complete" Transaction</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Closes out the active attendee transaction, logs exact service duration metrics into the analytics database, clears the desk visual sign, and enables the operator to trigger the next call.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">❌ "No Show" Abort Action</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Permitted if a caller fails to respond after three recalls. Drops the ticket from active queue streams and logs an unfulfilled status to maintain performance metric accuracy.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">📊 Live Counter Efficiency Panels</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Real-time statistic calculations on the operator interface detailing: Total customers served, Average waiting duration, and Active counter service-time.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-amber-400 block font-bold uppercase tracking-wider text-[11px]">📜 Queue Logs Timeline</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          A scrollable historical timeline located at the bottom of the dashboard revealing previously called, served, cancelled, or flagged slots for rapid verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operation rules summary */}
                  <div className="bg-amber-550/10 border border-amber-500/20 rounded-xl p-5 text-xs text-amber-200/90 leading-relaxed space-y-2">
                    <h4 className="font-extrabold text-white uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> OPERATIONAL AUDITING HIGHLIGHT
                    </h4>
                    <p>
                      Every action logged on this staff console updates the central administrative efficiency spreadsheets in real-time. Do not share your credential profile logons with anyone else, as wait-times and response-times are tracked under your username profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Option 3: Administrator Tab */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Authenticator barrier if locked */}
              {!isAdminUnlocked ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-14 h-14 bg-red-500/10 border border-red-550/30 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-red-500" />
                  </div>
                  
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-black text-white uppercase italic">Administrator Manual Securiground</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Access to the event deployment walkthrough requires administrative authentication. Enter the standard authorization key to view.
                    </p>
                  </div>

                  <form onSubmit={handleAdminUnlock} className="w-full max-w-sm space-y-4">
                    {adminError && (
                      <div className="text-[11px] font-medium bg-red-950/40 text-red-300 border border-red-500/20 rounded-lg p-3 text-left flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{adminError}</span>
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type={showAdminPass ? "text" : "password"}
                        placeholder="Enter Administrative Authorization Key"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 pl-4 pr-11 text-xs focus:outline-none focus:border-red-500 transition font-mono text-center placeholder:text-zinc-750"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(p => !p)}
                        className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white"
                      >
                        {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      id="btn-admin-unlock"
                      className="w-full bg-red-650 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider rounded-xl py-3 cursor-pointer transition shadow-lg"
                    >
                      Authenticate Access
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8 animate-fade-in">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-1 bg-red-950 text-red-405 rounded-md border border-red-500/20 font-black">
                        ROLE: MASTER ADMINISTRATOR
                      </span>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        Central Command Console Guide
                      </h2>
                    </div>

                    <button
                      onClick={() => setIsAdminUnlocked(false)}
                      className="text-[10px] font-mono font-black uppercase bg-zinc-950 hover:bg-zinc-800 border border-zinc-805 text-zinc-400 hover:text-zinc-300 rounded-lg px-3 py-1.5 transition"
                    >
                      Lock Section
                    </button>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                    The control panel allows system-wide manipulation of prioritizing parameters, deploying service agents, tracking total metrics, and exporting analytical spreadsheet data.
                  </p>

                  {/* Generated Admin View Screenshot */}
                  <div className="bg-black/65 border border-zinc-855 rounded-2xl p-4 overflow-hidden shadow-2xl">
                    <img 
                      src={adminManualImg} 
                      alt="Admin Station Kiosk Mockup" 
                      referrerPolicy="no-referrer"
                      className="rounded-lg w-full max-h-[380px] object-cover hover:scale-[1.01] transition duration-300" 
                    />
                    <span className="text-[9px] font-mono text-zinc-550 block text-center mt-3 uppercase tracking-widest">
                      Figure 3.1: Central Event Configuration panel, user directory, priority selectors and analytical spreadsheets
                    </span>
                  </div>

                  {/* Admin Walkthrough Sections */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white border-b border-zinc-800 pb-2">
                      Master Administrator Workflows
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      
                      <div className="bg-zinc-950/40 p-5 rounded-xl border border-zinc-850 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-extrabold uppercase tracking-wide">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <span>Event Configuration Schema</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                          Admins can toggle the registration scheme on the fly between:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-zinc-500 pl-1 font-medium">
                          <li><strong className="text-white">Option 1</strong>: Standard Public vs. ICC VIP Members</li>
                          <li><strong className="text-white">Option 2</strong>: Singapore Resident Priority routing</li>
                        </ul>
                      </div>

                      <div className="bg-zinc-950/40 p-5 rounded-xl border border-zinc-850 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-extrabold uppercase tracking-wide">
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                          <span>Staff Registration & Deployment</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                          Admins can dynamically <strong>Create, Update, or Delete</strong> staff operator credentials. These accounts can be locked onto a single counter (e.g., Counter 1) or allowed to act as floating operators.
                        </p>
                      </div>

                      <div className="bg-zinc-950/40 p-5 rounded-xl border border-zinc-850 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-extrabold uppercase tracking-wide">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          <span>Spreadsheet Audit Export</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                          Click the <strong>Download Event Spreadsheets</strong> button in the statistics panel to instantly run a native export of queue timings, DOB records, call timestamps, wait times, and staff efficiency metrics in CSV format.
                        </p>
                      </div>

                      <div className="bg-zinc-950/40 p-5 rounded-xl border border-zinc-850 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-extrabold uppercase tracking-wide">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Instant Core Reset</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                          The red <strong>Hard Reset</strong> button triggers a fully authoritative queue cleanup across all active connected sockets, flashing clean boards for the next session. Use this with extreme caution.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Priority Algorithm explanation */}
                  <div className="border border-zinc-800 bg-black/40 rounded-xl p-5 text-xs text-zinc-400 space-y-3 leading-relaxed">
                    <h4 className="font-extrabold text-white uppercase text-xs">
                      Understanding Priority Algorithm Rules
                    </h4>
                    <p>
                      The master queue algorithm operates on distinct prioritization rules which can be selected inside the Staff dashboard:
                    </p>
                    <div className="space-y-2 font-mono text-[11px] text-zinc-500 pl-2 border-l border-indigo-500/30 font-medium font-bold">
                      <div><strong className="text-indigo-400 font-bold">FIFO</strong>: First In First Out. Pure registration-time queue tracking.</div>
                      <div><strong className="text-indigo-400 font-bold">Priority Only</strong>: Calls VIPs / SG-Residents first until empty, then calls the general public.</div>
                      <div><strong className="text-indigo-400 font-bold">Ratio (3:1) / (2:1)</strong>: Iterates up to 3 VIPs followed by 1 general public ticket consecutively.</div>
                    </div>
                  </div>

                  {/* Administrative Detailed Features Glossary */}
                  <div className="space-y-6 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-3">
                      Administrator Command Console Features Glossary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">⚙️ Registration Intake Toggle</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          A master switch allowing administrators to halt or open the student/visitor self-registration form online. Prevents queue flooding when the facility reaches maximum daily capacity limit.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">👥 Category Schema Switch</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Swaps the queue categories scheme dynamically. Schemes can be focused on standard status memberships (VIP Members vs Public) or regional routing rules (Singapore Residents vs general attendees).
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">📝 Staff Account Manager</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          A central interface enabling full Creation, Reading, Updating, and Deletion (CRUD) of desk operators. Set credentials, modify desk bindings, and show or hide password passphrases via the security view state.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">📊 Live Interactive Charts</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          High fidelity D3/Recharts data visualizations showing real-time statistics covering: Peak arrival times, counter efficiency ratings, waiting distribution percentiles, and served counts.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">📥 Multi-System CSV Exporter</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Compiles the entire visitor database session logs (waiting durations, service times, priority status data, phone number registries, etc.) into standard formatted Excel/CSV tables with a single click.
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">⚠️ Authorization Key Lockout</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          Protects crucial admin commands. Critical modifications, credential manipulations, or system resets cannot be performed without submitting the system key (default passcode is "admin").
                        </p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-1 col-span-1 md:col-span-2">
                        <strong className="text-red-400 block font-bold uppercase tracking-wider text-[11px]">💣 Authoritative System Reset ("Hard Reset")</strong>
                        <p className="text-zinc-400 leading-relaxed">
                          An orange-red destructive control that instantly flushes all databases, resets all server tickets back to zero, clears desk caller memory, and forces all active users dynamically back onto the home welcome panel. Useful for beginning a fresh daily session.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vercel & Production Cloud Deployment Guide */}
                  <div className="space-y-4 pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2 flex items-center gap-1.5">
                      ☁️ Multi-Cloud Deployment Guide (Vercel & Google Cloud Run)
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This V-QUEUE suite is fully optimized for container runtimes like <strong className="text-white">Google Cloud Run</strong> and high-speed serverless deployment platforms like <strong className="text-white">Vercel</strong>. To host on your preferred platform:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-black/50 border border-zinc-850 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase">▲ OPTION A: VERCEL HOSTING</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          We have pre-configured a custom <strong className="text-white">vercel.json</strong> rule set. When compiling with Vercel:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-550 text-[10px]">
                          <li>Vercel automatically compiles your client React SPA with extreme production speeds via Vite.</li>
                          <li>Any client-side path refers back to <strong className="text-white">/index.html</strong> to prevent 404 router faults on refreshes.</li>
                          <li>To connect real-time sockets, you can link the client to your live persistent API container URL.</li>
                        </ol>
                      </div>

                      <div className="bg-black/50 border border-zinc-850 rounded-xl p-4 space-y-2">
                        <span className="text-[10px] text-emerald-450 text-emerald-400 font-bold block uppercase">🚀 OPTION B: CONTAINER HOSTING (Cloud Run)</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Ideal for persistent in-memory session arrays. By running the pre-bundled Dockerfile on Cloud Run:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-550 text-[10px]">
                          <li>Standard HTTP and upgrading persistent bi-directional WebSockets work natively on a single port.</li>
                          <li>The memory storage keeps client socket groups fully synced instantly in real time.</li>
                          <li>The companion metrics are exported seamlessly directly from memory to spreadsheet logs.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Manual page footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950/40 p-5 text-center text-zinc-650 text-[10px] font-mono flex items-center justify-between px-8">
        <div>Manual Integrity Approved © V-QUEUE International Inc.</div>
        <div>AUTHORIZED ACCESS STRICTLY MONITORED</div>
      </footer>
    </div>
  );
}
