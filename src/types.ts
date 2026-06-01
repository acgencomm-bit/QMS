export type AttendeeType = 'member' | 'public';

export type QueueStatus = 'waiting' | 'called' | 'arrived' | 'completed' | 'noshow';

export interface QueueItem {
  id: string;
  name: string;
  type: AttendeeType;
  ticketNumber: string;
  status: QueueStatus;
  joinedAt: number;
  priorityScore: number;
  calledAt: number | null;
  calledByCounter: string | null;
  acknowledgedAt: number | null;
  dobDay?: number;
  dobMonth?: number;
  dobYear?: number;
  countryCode?: string;
  phoneNumber?: string;
}

export interface CounterState {
  id: string; // e.g., '1', '2', '3', '4', '5'
  name: string; // "Counter 1" ... "Counter 5"
  staffUsername: string | null;
  currentServeId: string | null;
  status: 'idle' | 'calling' | 'serving';
}

export type PriorityMode = 'FIFO' | 'MEMBER_FIRST' | 'RATIO_3_1' | 'RATIO_2_1' | 'RATIO_PUBLIC_3_1';

export interface StaffAccount {
  username: string;
  password: string;
  assignedCounterId: string; // '1','2','3','4','5' or 'any'
}

export interface QueueState {
  items: QueueItem[];
  counters: CounterState[];
  priorityMode: PriorityMode;
  accounts: StaffAccount[];
  categorySchema?: 'option1' | 'option2';
}

// WS message protocol
export type ClientMessageType =
  | 'staff_login'
  | 'staff_logout'
  | 'join_queue'
  | 'call_next'
  | 'recall'
  | 'complete_serve'
  | 'no_show'
  | 'acknowledge_call'
  | 'update_priority'
  | 'update_category_schema'
  | 'reset_queue'
  | 'update_item_priority'
  | 'add_staff_account'
  | 'delete_staff_account'
  | 'update_staff_account';

export interface ClientMessage {
  type: ClientMessageType;
  payload: any;
}

export interface ServerMessage {
  type: 'state_update' | 'ticket_called' | 'error' | 'joined_success';
  payload: any;
}

export function getCategoryLabels(schema?: 'option1' | 'option2') {
  if (schema === 'option2') {
    return {
      memberLabel: 'Located in Singapore',
      publicLabel: 'Located outside of Singapore',
      memberShort: 'Singapore',
      publicShort: 'Outside SG',
      memberBadge: '🇸🇬 SG Resident',
      publicBadge: '🌍 Outside SG',
      memberOptionText: 'Located in Singapore',
      publicOptionText: 'Located outside of Singapore',
      memberRegisterTitle: 'Located in Singapore',
      publicRegisterTitle: 'Located outside of Singapore',
      memberRegisterDesc: 'Local priority processing',
      publicRegisterDesc: 'Standard international line',
    };
  }
  return {
    memberLabel: 'ICC Member',
    publicLabel: 'Public',
    memberShort: 'ICC Member',
    publicShort: 'Public',
    memberBadge: '💥 ICC Member',
    publicBadge: '✨ Public Pass',
    memberOptionText: 'ICC Member',
    publicOptionText: 'Public Pass',
    memberRegisterTitle: 'ICC Member',
    publicRegisterTitle: 'Public Pass',
    memberRegisterDesc: 'Express high priority line',
    publicRegisterDesc: 'Standard queue routing slot',
  };
}

export function formatDob(day: number | string | undefined, month: number | string | undefined, year: number | string | undefined): string {
  if (!day || !month || !year) return '';
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIndex = Number(month) - 1;
  const monthStr = (mIndex >= 0 && mIndex < 12) ? monthsShort[mIndex] : 'Jan';
  const dayStr = String(day).padStart(2, '0');
  return `${dayStr} ${monthStr} ${year}`;
}

