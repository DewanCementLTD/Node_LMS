export interface LeaveBalance {
  leave_type: number | string;
  leave_desc?: string;
  balance: number;
  is_od?: boolean;
}

// One row of the LEAVE_TYPES LOV (all applyable types, merged with balances).
// leave_type_pk is the unique numeric identifier to submit — the code
// (leave_type) is NOT unique ('CL' appears twice in LEAVE_TYPES).
export interface LeaveType {
  leave_type: number | string;
  leave_type_pk: number | null;
  leave_desc?: string;
  balance: number | null;
  is_od?: boolean;
}

export interface LeaveBalanceResponse {
  items: LeaveBalance[];
}

export interface LeaveTypesResponse {
  items: LeaveType[];
}

export interface LeaveApplyRequest {
  from_date: string;
  to_date: string;
  reason: string;
  leave_type_id: number;
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
