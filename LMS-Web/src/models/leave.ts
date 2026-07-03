export interface LeaveBalance {
  leave_type: number | string;
  leave_desc?: string;
  balance: number;
  is_od?: boolean;
}

export interface LeaveBalanceResponse {
  items: LeaveBalance[];
}

export interface LeaveType {
  leave_type: number | string;
  leave_desc?: string;
  balance?: number | null;
  is_od: boolean;
}

export interface LeaveTypesResponse {
  items: LeaveType[];
}

export interface LeaveApplyRequest {
  from_date: string;
  to_date: string;
  reason: string;
  // Leave type code (e.g. "ML") — codes are strings, never parseInt them
  type: string;
  leave_type_id?: number;
  half_day?: boolean;
  half_day_session?: "first" | "second";
  compc: number;
  brnch: number;
  emp_name: string;
}

export interface LeaveApplication {
  leave_type: string;
  leave_desc?: string;
  from_date: string;
  to_date: string;
  leave_days?: number;
  reason?: string;
  status: string;
  entry_date?: string;
}

export interface LeaveStatusResponse {
  items: LeaveApplication[];
}
