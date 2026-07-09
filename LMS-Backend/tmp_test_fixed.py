import json
from repositories.user_repository import (
    get_dashboard, get_leave_status, get_leave_types, get_leave_balances,
    authenticate_user, get_user_profile,
)

print("=== dashboard 50201552.2.3 ===")
print(json.dumps(get_dashboard("50201552.2.3"), indent=1, default=str))

print("\n=== authenticate 3012873945 ===")
u = authenticate_user("3012873945", "ABCD1234")
print(json.dumps({k: u[k] for k in ("card_no", "emp_name", "empcode", "hr_admin")} if u else None, indent=1, default=str))

print("\n=== leave types ===")
print(json.dumps(get_leave_types("50201552.2.3"), indent=1, default=str))

print("\n=== leave balances ===")
print(json.dumps(get_leave_balances("50201552.2.3"), indent=1, default=str))

print("\n=== leave status (first 5) ===")
st = get_leave_status("50201552.2.3")
print(json.dumps(st[:5], indent=1, default=str))
print(f"total: {len(st)}")

print("\n=== profile ===")
p = get_user_profile("50201552.2.3")
print(json.dumps({k: p.get(k) for k in ("emp_name", "designation", "department", "card_no", "date_of_join")} if p else None, indent=1, default=str))
