import React, { useState } from 'react';
import { 
  User, 
  Smartphone, 
  Users, 
  Award, 
  Ticket, 
  ChevronRight,
  Sparkles,
  Home,
  AlertTriangle
} from 'lucide-react';
import { AttendeeType, getCategoryLabels } from '../types';

interface JoinViewProps {
  onJoin: (name: string, type: AttendeeType, dobDay: number, dobMonth: number, dobYear: number, countryCode: string, phoneNumber: string) => void;
  isLoading: boolean;
  onNavigateHome: () => void;
  categorySchema?: 'option1' | 'option2';
}

export default function JoinView({ onJoin, isLoading, onNavigateHome, categorySchema = 'option1' }: JoinViewProps) {
  const labels = getCategoryLabels(categorySchema);

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AttendeeType>('public');
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+65');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);

  const isFormDirty = () => {
    return name.trim() !== '' || dobDay !== '' || dobMonth !== '' || dobYear !== '' || type !== 'public' || phoneNumber.trim() !== '';
  };

  const handleBackClick = () => {
    if (isFormDirty()) {
      setShowLeaveConfirm(true);
    } else {
      onNavigateHome();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter your name to secure a queue slot.');
      return;
    }

    if (trimmedName.length > 30) {
      setFormError('Name is too long. Please keep it under 30 characters.');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      setFormError('Please complete your Date of Birth (select Day, Month, and Year).');
      return;
    }

    const dayNum = parseInt(dobDay, 10);
    const monthNum = parseInt(dobMonth, 10);
    const yearNum = parseInt(dobYear, 10);

    // Validate actual calendar days for chosen month/year
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const maxDaysInMonth = (m: number, y: number) => {
      if (m === 2) return isLeapYear(y) ? 29 : 28;
      if ([4, 6, 9, 11].includes(m)) return 30;
      return 31;
    };

    if (dayNum > maxDaysInMonth(monthNum, yearNum)) {
      setFormError(`Invalid date configuration: the selected month doesn't have ${dayNum} days in ${yearNum}.`);
      return;
    }

    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setFormError('Please enter your phone number to secure a queue slot.');
      return;
    }

    if (!/^[0-9\s\-]{5,15}$/.test(trimmedPhone)) {
      setFormError('Please enter a valid phone number (5 to 15 digits consisting of numbers, spaces or dashes).');
      return;
    }

    onJoin(trimmedName, type, dayNum, monthNum, yearNum, countryCode, trimmedPhone);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between font-sans px-4 py-8" id="join-card-form">
      {/* Top Header navbar */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-black p-2.5 rounded">
            <Ticket className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest uppercase">JOIN QUEUE</h2>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Instant live socket delivery</p>
          </div>
        </div>

        <button
          onClick={handleBackClick}
          className="p-3 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Back to Dashboard"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Main card box */}
      <div className="w-full max-w-md mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col justify-center">
        
        <div className="mb-6 space-y-2">
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-2">
            Secure Slot <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400 animate-pulse" />
          </h3>
          <p className="text-xs text-zinc-400 leading-normal">
            Fill in your details. We immediately assign a ticket ID and flash your device when your counter becomes ready.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="attendee-name" className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
                Your Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="attendee-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name..."
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-650 transition font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone Number Input with Country Code Dropdown */}
            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
                Phone Number
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <select
                    id="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg p-3.5 text-sm text-white placeholder-zinc-650 transition font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    {[
                      { code: '+65', label: '🇸🇬 +65' },
                      { code: '+1', label: '🇺🇸 +1' },
                      { code: '+44', label: '🇬🇧 +44' },
                      { code: '+61', label: '🇦🇺 +61' },
                      { code: '+60', label: '🇲🇾 +60' },
                      { code: '+62', label: '🇮🇩 +62' },
                      { code: '+63', label: '🇵🇭 +63' },
                      { code: '+66', label: '🇹🇭 +66' },
                      { code: '+91', label: '🇮🇳 +91' },
                      { code: '+81', label: '🇯🇵 +81' },
                      { code: '+82', label: '🇰🇷 +82' },
                      { code: '+86', label: '🇨🇳 +86' },
                      { code: '+852', label: '🇭🇰 +852' },
                      { code: '+886', label: '🇹🇼 +886' },
                      { code: '+971', label: '🇦🇪 +971' },
                      { code: '+33', label: '🇫🇷 +33' },
                      { code: '+49', label: '🇩🇪 +49' },
                      { code: '+39', label: '🇮🇹 +39' },
                      { code: '+31', label: '🇳🇱 +31' },
                      { code: '+64', label: '🇳🇿 +64' },
                    ].map((item) => (
                      <option key={item.code} value={item.code} className="bg-zinc-900 text-white">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    id="phone-number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number..."
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-650 transition font-medium font-mono"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-1.5 p-1 bg-black/10 rounded">
                <span className="text-zinc-400 font-bold">Privacy Notice:</span> In accordance with international data security privacy standards (such as GDPR & PDPA), your phone number is collected solely to keep you updated on your current queue slot status for this particular event. We strictly do not use your phone number for any marketing, promotional, or secondary solicitation campaigns.
              </p>
            </div>

            {/* Date of Birth Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <select
                    id="dob-day"
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg p-3 text-sm text-white placeholder-zinc-650 transition font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="" disabled className="text-zinc-600">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d.toString()} className="bg-zinc-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    id="dob-month"
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg p-3 text-sm text-white placeholder-zinc-650 transition font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="" disabled className="text-zinc-600">Month</option>
                    {[
                      { v: 1, l: 'Jan' },
                      { v: 2, l: 'Feb' },
                      { v: 3, l: 'Mar' },
                      { v: 4, l: 'Apr' },
                      { v: 5, l: 'May' },
                      { v: 6, l: 'Jun' },
                      { v: 7, l: 'Jul' },
                      { v: 8, l: 'Aug' },
                      { v: 9, l: 'Sep' },
                      { v: 10, l: 'Oct' },
                      { v: 11, l: 'Nov' },
                      { v: 12, l: 'Dec' }
                    ].map((m) => (
                      <option key={m.v} value={m.v.toString()} className="bg-zinc-900 text-white">
                        {m.l} ({m.v})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    id="dob-year"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-white focus:outline-none rounded-lg p-3 text-sm text-white placeholder-zinc-650 transition font-medium cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="" disabled className="text-zinc-600">Year</option>
                    {Array.from({ length: 120 }, (_, i) => 2026 - i).map((y) => (
                      <option key={y} value={y.toString()} className="bg-zinc-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Ticket Category Selector */}
            <div className="space-y-2.5 bg-zinc-900/40">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
                Choose Registration Category
              </label>
              
              <div className="grid grid-cols-2 gap-3.5">
                {/* Public Selector */}
                <div
                  id="select-type-public"
                  onClick={() => !isLoading && setType('public')}
                  className={`border rounded-xl p-4 cursor-pointer select-none flex flex-col justify-between items-start transition-all ${
                    type === 'public'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      {labels.publicRegisterTitle}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      {labels.publicRegisterDesc}
                    </p>
                  </div>
                </div>

                {/* Member Selector */}
                <div
                  id="select-type-member"
                  onClick={() => !isLoading && setType('member')}
                  className={`border rounded-xl p-4 cursor-pointer select-none flex flex-col justify-between items-start transition-all ${
                    type === 'member'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-3">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {labels.memberRegisterTitle}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      {labels.memberRegisterDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/10 py-3 px-4 border border-rose-500/20 rounded">
                {formError}
              </p>
            )}
          </div>

          <div className="pt-4 mt-auto">
            <button
              type="submit"
              id="submit-take-ticket"
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-100 text-black font-black uppercase tracking-widest rounded-lg py-4 flex items-center justify-center gap-1.5 transition text-xs disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              {isLoading ? 'SECURING SPOT...' : 'GET AUTOMATED TICKET'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Trust Sign Footer */}
      <div className="w-full max-w-sm mx-auto text-center text-zinc-550 text-[9px] font-mono mt-6 flex items-center justify-center gap-2 uppercase tracking-widest font-extrabold">
        <Smartphone className="w-3.5 h-3.5 text-zinc-400" /> 
        No carrier rates &bull; direct lightweight socket hub
      </div>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in text-white font-sans">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">Discard Progress?</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
              You are in the middle of completing your queue registry form. If you go back to the lobby, your inputs will be discarded. Would you like to stay to finish, or exit and discard changes?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                type="button"
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-755 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Stay & Continue
              </button>
              <button
                onClick={onNavigateHome}
                type="button"
                className="flex-1 py-3 bg-emerald-650 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg"
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
