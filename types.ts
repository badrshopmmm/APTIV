
export enum ShiftType {
  MORNING = 'Morning',
  EVENING = 'Evening',
  NIGHT = 'Night'
}

export enum ProductionLine {
  LINE_1 = 'Line 1',
  LINE_2 = 'Line 2',
  LINE_3 = 'Line 3'
}

export type AttendanceStatus = 'present' | 'absent' | 'ctp' | 'ctn' | 'cr' | 'tl' | 'et' | 'crn' | 'TE' | 'AP' | 'MT';

export interface Employee {
  id: string;
  name: string;
  department: string;
  role?: string; 
  supervisorId?: string;
}

export interface AttendanceRecord {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  attachmentUrl?: string;
}

export interface HourlyEntry {
  hour: number;
  reference: string;
  target: number;
  actual: number;
  rejects: number;
  note: string;
}

export interface ProductionEntry {
  id: string;
  shift: ShiftType;
  date: string;
  lineId: ProductionLine;
  leaderId: string;
  hourlyData: HourlyEntry[];
  totalOutput: number;
  totalTarget: number;
  totalRejects: number;
  efficiency: number;
  downtimeMinutes?: number;
  downtimeReason?: string;
}

export interface TeamLeader {
  id: string;
  name: string;
  role: string;
  email: string;
  serialNumber: string;
  whatsapp?: string;
  whatsappGroup?: string;
  groupEmail?: string;
  imageUrl: string;
  status: 'active' | 'on_leave' | 'stopped';
  stoppageReason?: string;
  returnDate?: string;
}

export interface ManagementMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  motto: string;
  type: 'director' | 'coordinator' | 'shift_chief';
}

export interface UnitManager extends ManagementMember {}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  unit: string;
}

export interface ScheduleEntry {
  id: string;
  leaderId: string;
  date: string;
  shift: ShiftType;
}
