from pydantic import BaseModel
from typing import List, Optional


# =========================
# AUTH
# =========================

class LoginRequest(BaseModel):
    username: str
    password: str
    # Optional client version info — only the mobile app sends these; the web
    # omits them, so the force-update guard never affects web logins.
    app_version: Optional[str] = None
    app_build: Optional[int] = None
    platform: Optional[str] = None


class CompanyItem(BaseModel):
    code: str
    name: str


class BranchItem(BaseModel):
    code: str
    name: str
    compc: Optional[str] = None   # company (COM_LOCATION.COMPC) this branch belongs to


class LoginResponse(BaseModel):
    status: str
    card_no: str
    emp_name: str = ""
    face_registered: bool = False
    hr_admin: bool = False
    has_self_service: bool = True
    has_employee_features: bool = True  # True if user is in HR_EMP_MASTER (can access employee modules)
    allowed_companies: List[str] = []
    allowed_branches: List[str] = []
    company_list: List[CompanyItem] = []
    branch_list: List[BranchItem] = []
    can_edit_salary: bool = False   # SEC_USERNAME.ULEVL == 'M'


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class MessageResponse(BaseModel):
    status: str
    message: str


# =========================
# DASHBOARD
# =========================

class DashboardResponse(BaseModel):
    emp_pk: Optional[float] = None
    card_no: str
    emp_no: Optional[str] = None
    emp_name: str
    date_of_join: Optional[str] = None
    nic_no: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    compcnm: Optional[str] = None
    compc: Optional[str] = None
    branch: Optional[str] = None
    brnchnm: Optional[str] = None
    hod: Optional[str] = None
    hod_nm: Optional[str] = None
    balance: Optional[float] = None


# =========================
# LEAVE
# =========================

class LeaveBalanceResponse(BaseModel):
    leave_type: str
    leave_desc: Optional[str]
    balance: float


class LeaveApplyRequest(BaseModel):
    # Flutter sends: type (leave code), from_date, to_date, reason, half_day,
    # and optionally from_time/to_time for half-day. It does NOT send
    # compc/brnch — those are resolved from the employee's EMPLOYEE_F row, so
    # they must stay optional here. card_no comes from the URL path parameter.
    type: Optional[str] = None           # Flutter field name
    leave_type_id: Optional[int] = None  # numeric FK (if known)
    from_date: str
    to_date: str
    reason: str
    half_day: Optional[bool] = False
    half_day_session: Optional[str] = None  # "first" | "second"
    from_time: Optional[str] = None      # Flutter half-day 'HH:MM'
    to_time: Optional[str] = None        # Flutter half-day 'HH:MM'
    compc: Optional[int] = None
    brnch: Optional[int] = None
    emp_name: str = ''


class LeaveStatusResponse(BaseModel):
    leave_type: str
    from_date: str
    to_date: str
    status: str


# =========================
# PROFILE
# =========================

class ProfileResponse(BaseModel):
    emp_name: str
    department: Optional[str] = None
    designation: Optional[str] = None
    email_address: Optional[str] = None
    mobile_no: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_join: Optional[str] = None
    father_name: Optional[str] = None
    nic_no: Optional[str] = None
    # response_model strips anything not listed here — the web profile page,
    # the printed timesheet header, AND the mobile app's EnhancedProfileModel
    # all read these.
    card_no: Optional[str] = None
    emp_pk: Optional[str] = None
    emp_no: Optional[str] = None
    emp_code: Optional[str] = None
    emp_status: Optional[str] = None
    type: Optional[str] = None
    cadre: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    compc: Optional[str] = None
    brnch: Optional[str] = None
    compcnm: Optional[str] = None
    brnchnm: Optional[str] = None
    hod1: Optional[str] = None
    hod2: Optional[str] = None
    hod_nm: Optional[str] = None
    hod1nm: Optional[str] = None
    hod2nm: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    salary: Optional[float] = None
    nic_exp_date: Optional[str] = None
    eobi_no: Optional[str] = None
    uic_card_no: Optional[str] = None
    confirmation_date: Optional[str] = None
    manager_above_sts: Optional[str] = None
    company_accomodation: Optional[str] = None
    emergency_contact: Optional[dict] = None


class EmergencyContactRequest(BaseModel):
    name: str
    relationship: str = ''
    phone: str = ''


# Attendance models moved to models/attendance_models.py