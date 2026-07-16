# Reference API Comparison: Localhost vs Live

*Generated automatically on 2026-07-16T04:17:15.580Z*
*Admin Card Number used: 100001.1*
*Note: All admin authorized requests also query authentication/validation tables: `HR_EMP_MASTER`, `EMPLOYEE`, `SEC_USERNAME`.*

### Route: GET /reference/departments?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_DEPT`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;23,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"ACCOUNTS"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;22,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"ADMIN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;12,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"BOILER&nbsp;Department"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;23&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;23,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"ACCOUNTS"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;22,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"ADMIN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_no":&nbsp;12,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dept_name":&nbsp;"BOILER&nbsp;Department"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;23&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/grades?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_GRADE_CD`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"GRADE&nbsp;SEVENTEEN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"10",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"SENIOR&nbsp;OFFICER"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"11",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"OFFICER"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;40&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"GRADE&nbsp;SEVENTEEN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"10",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"SENIOR&nbsp;OFFICER"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"11",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"OFFICER"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;40&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/designations?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_DESG`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"GR-1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"93",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"WELDER"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"WR",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"Asst&nbsp;Supervisor"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"WR",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"Tank&nbsp;Yard&nbsp;Operator"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;90&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"GR-1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"93",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"WELDER"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"WR",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"Asst&nbsp;Supervisor"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"grade_cd":&nbsp;"WR",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_cd":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"desg_desc":&nbsp;"Tank&nbsp;Yard&nbsp;Operator"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;90&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/emp-statuses?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_STATUS`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"PROBATIONERY"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"PERMANENT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"CONTRACTUAL"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;4&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"PROBATIONERY"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"PERMANENT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"emp_status":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"CONTRACTUAL"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;4&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/banks?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BANK`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"5",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"BANK&nbsp;ISLAMI&nbsp;PAKISTAN&nbsp;LTD."<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"CASH&nbsp;PAYMENT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"6",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"DUBAI&nbsp;ISLAMIC&nbsp;BANK&nbsp;PAK&nbsp;LTD"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;4&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"5",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"BANK&nbsp;ISLAMI&nbsp;PAKISTAN&nbsp;LTD."<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"CASH&nbsp;PAYMENT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkcode":&nbsp;"6",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"bnkname":&nbsp;"DUBAI&nbsp;ISLAMIC&nbsp;BANK&nbsp;PAK&nbsp;LTD"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;4&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/bank-branches?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BRANCH`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"17",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"Adyala&nbsp;Road&nbsp;Branch"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"9",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"BANK&nbsp;ISLAMI,&nbsp;1-10&nbsp;MARKAZ&nbsp;3088"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"BANK&nbsp;ISLAMI,&nbsp;BLUE&nbsp;AREA"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;58&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"17",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"Adyala&nbsp;Road&nbsp;Branch"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"9",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"BANK&nbsp;ISLAMI,&nbsp;1-10&nbsp;MARKAZ&nbsp;3088"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brncode":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnname":&nbsp;"BANK&nbsp;ISLAMI,&nbsp;BLUE&nbsp;AREA"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;58&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/qualifications?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_QUALIFICATION`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"BSCC&nbsp;MECHANICAL&nbsp;ENGINEERING"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"MATRIC"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"SSC"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"BSCC&nbsp;MECHANICAL&nbsp;ENGINEERING"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"MATRIC"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"SSC"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> |

---

### Route: GET /reference/shifts?compc=1&admin_card_no=100001.1
**Database Table(s):** `SHIFT_HEAD`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;2,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"A",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"A&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"08:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"17:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"08:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"11:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"18:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"09:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"16:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"16:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"12:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"15:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"10:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;3,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"B",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"B&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"08:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"17:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"08:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"11:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"18:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"09:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"16:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"16:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"12:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"15:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"10:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;4,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"C",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"C&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"10:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"19:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"10:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"13:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"20:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"11:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"18:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"18:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"14:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"17:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"12:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;2,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"A",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"A&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"08:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"17:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"08:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"11:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"18:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"09:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"16:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"16:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"12:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"15:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"10:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;3,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"B",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"B&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"08:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"17:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"08:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"11:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"18:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"09:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"16:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"16:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"12:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"15:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"10:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_head_pk":&nbsp;4,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"C",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift_desc":&nbsp;"C&nbsp;SHIFT",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_from":&nbsp;"10:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time_to":&nbsp;"19:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"overtime_start_time":&nbsp;null,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"allow_in_time":&nbsp;"05:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_start_tm":&nbsp;"10:15",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_tm":&nbsp;"13:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_tm":&nbsp;"20:45",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_sit_allow_tm":&nbsp;"11:40",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"duty_hrs":&nbsp;9,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_start":&nbsp;"18:00",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_late_end":&nbsp;"18:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_start":&nbsp;"14:31",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"early_out_hday_end":&nbsp;"17:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"late_end_tm":&nbsp;"12:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"half_day_end_tm":&nbsp;"23:59",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"day_name":&nbsp;"OTHER",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"compc":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brnch":&nbsp;1<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/shift-lov?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_SHIFT`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"A",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"A&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"B",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"B&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"C",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"C&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"A",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"A&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"B",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"B&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"shift":&nbsp;"C",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"C&nbsp;SHIFT"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/blood-groups?compc=1&admin_card_no=100001.1
**Database Table(s):** `BLOOD_GROUP`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"A+"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;2,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"A-"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;3,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"B+"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;1,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"A+"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;2,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"A-"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;3,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"blood_group":&nbsp;"B+"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;5&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/cadre?compc=1&admin_card_no=100001.1
**Database Table(s):** `CADRE`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;12,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-1"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;18,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-2"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;4,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-3"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;15&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;12,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-1"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;18,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-2"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk":&nbsp;4,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"cadre":&nbsp;"JM-3"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;15&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/units?compc=1&admin_card_no=100001.1
**Database Table(s):** `UNIT_MST`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Chef&nbsp;&amp;&nbsp;Butler"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Demo&nbsp;Company"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"4",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Pentasoll"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Red&nbsp;n&nbsp;Bed"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"3",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Chef&nbsp;&amp;&nbsp;Butler"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Demo&nbsp;Company"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"4",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Pentasoll"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_id":&nbsp;"2",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"unit_name":&nbsp;"Red&nbsp;n&nbsp;Bed"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> |

---

### Route: GET /reference/religions?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_MASTER` (reads distinct religion values)

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"1"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"11",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"11"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"5",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"5"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;7&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"1"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"11",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"11"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"5",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"label":&nbsp;"5"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;7&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/reporting-officers?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_MASTER` (reads active reporting officers)

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100394.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;KHAN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100022.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;Khan&nbsp;pathan"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100292.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;Rizvi"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;616&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100394.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;KHAN"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100022.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;Khan&nbsp;pathan"<br>&nbsp;&nbsp;&nbsp;&nbsp;},<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"empcode":&nbsp;"100292.1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":&nbsp;"ABBAS&nbsp;Rizvi"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;],<br>&nbsp;&nbsp;"_note":&nbsp;"...&nbsp;truncated&nbsp;616&nbsp;items&nbsp;for&nbsp;readability"<br>}</pre> |

---

### Route: GET /reference/locations?compc=1&admin_card_no=100001.1
**Database Table(s):** `COM_LOCATION`

**Body:**
**req obj:** None

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"lcode":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"KARACHI&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"sname":&nbsp;"KARACHI&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"regioncode":&nbsp;"HEAD&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"city":&nbsp;"Karachi"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"items":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"lcode":&nbsp;"1",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"descr":&nbsp;"KARACHI&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"sname":&nbsp;"KARACHI&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"regioncode":&nbsp;"HEAD&nbsp;OFFICE",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"city":&nbsp;"Karachi"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> |

---

### Route: POST /reference/departments?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_DEPT`

**Body:**
**req obj:**
```json
{
    "dept_name": "MCP Test Dept"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"dept_no":&nbsp;28,<br>&nbsp;&nbsp;"dept_name":&nbsp;"MCP&nbsp;Test&nbsp;Dept"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"dept_no":&nbsp;29,<br>&nbsp;&nbsp;"dept_name":&nbsp;"MCP&nbsp;Test&nbsp;Dept"<br>}</pre> |

---

### Route: POST /reference/grades?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_GRADE_CD`

**Body:**
**req obj:**
```json
{
    "grade_cd": "MCPG",
    "descr": "MCP Grade"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"grade_cd":&nbsp;"MCPG",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Grade"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"grade_cd":&nbsp;"MCPG",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Grade"<br>}</pre> |

---

### Route: POST /reference/designations?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_DESG`

**Body:**
**req obj:**
```json
{
    "grade_cd": "MCPG",
    "desg_desc": "MCP Desg"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-00001:&nbsp;unique&nbsp;constraint&nbsp;(HRMS.PK_DESG_NO)&nbsp;violated"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-00001:&nbsp;unique&nbsp;constraint&nbsp;(HRMS.PK_DESG_NO)&nbsp;violated\nHelp:&nbsp;https://docs.oracle.com/error-help/db/ora-00001/"<br>}</pre> |

---

### Route: POST /reference/shifts?compc=1&admin_card_no=100001.1
**Database Table(s):** `SHIFT_HEAD`

**Body:**
**req obj:**
```json
{
    "shift": "X",
    "shift_desc": "MCP Shift"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Shift&nbsp;'X'&nbsp;is&nbsp;already&nbsp;configured&nbsp;for&nbsp;this&nbsp;company/branch"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Shift&nbsp;'X'&nbsp;is&nbsp;already&nbsp;configured&nbsp;for&nbsp;this&nbsp;company/branch"<br>}</pre> |

---

### Route: POST /reference/blood-groups?compc=1&admin_card_no=100001.1
**Database Table(s):** `BLOOD_GROUP`

**Body:**
**req obj:**
```json
{
    "blood_group": "MCP+"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"pk":&nbsp;9,<br>&nbsp;&nbsp;"blood_group":&nbsp;"MCP+"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"pk":&nbsp;10,<br>&nbsp;&nbsp;"blood_group":&nbsp;"MCP+"<br>}</pre> |

---

### Route: POST /reference/cadre?compc=1&admin_card_no=100001.1
**Database Table(s):** `CADRE`

**Body:**
**req obj:**
```json
{
    "cadre": "MCP"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"pk":&nbsp;19,<br>&nbsp;&nbsp;"cadre":&nbsp;"MCP"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"pk":&nbsp;20,<br>&nbsp;&nbsp;"cadre":&nbsp;"MCP"<br>}</pre> |

---

### Route: POST /reference/units?compc=1&admin_card_no=100001.1
**Database Table(s):** `UNIT_MST`

**Body:**
**req obj:**
```json
{
    "unit_name": "MCP Unit"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-01400:&nbsp;cannot&nbsp;insert&nbsp;NULL&nbsp;into&nbsp;(\"HRMS\".\"COMPANY_INFO\".\"STATS\")"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-01400:&nbsp;cannot&nbsp;insert&nbsp;NULL&nbsp;into&nbsp;(\"HRMS\".\"COMPANY_INFO\".\"STATS\")\nHelp:&nbsp;https://docs.oracle.com/error-help/db/ora-01400/"<br>}</pre> |

---

### Route: POST /reference/locations?compc=1&admin_card_no=100001.1
**Database Table(s):** `COM_LOCATION`

**Body:**
**req obj:**
```json
{
    "lcode": "9999",
    "descr": "MCP Loc"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-01400:&nbsp;cannot&nbsp;insert&nbsp;NULL&nbsp;into&nbsp;(\"HRMS\".\"COM_LOCATION\".\"USRID\")"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"ORA-01400:&nbsp;cannot&nbsp;insert&nbsp;NULL&nbsp;into&nbsp;(\"HRMS\".\"COM_LOCATION\".\"USRID\")\nHelp:&nbsp;https://docs.oracle.com/error-help/db/ora-01400/"<br>}</pre> |

---

### Route: POST /reference/emp-statuses?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_STATUS`

**Body:**
**req obj:**
```json
{
    "descr": "MCP Test Status"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"emp_status":&nbsp;"8",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Test&nbsp;Status"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"emp_status":&nbsp;"9",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Test&nbsp;Status"<br>}</pre> |

---

### Route: POST /reference/banks?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BANK`

**Body:**
**req obj:**
```json
{
    "bnkname": "MCP Bank"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"bnkcode":&nbsp;"7",<br>&nbsp;&nbsp;"bnkname":&nbsp;"MCP&nbsp;Bank"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"bnkcode":&nbsp;"8",<br>&nbsp;&nbsp;"bnkname":&nbsp;"MCP&nbsp;Bank"<br>}</pre> |

---

### Route: POST /reference/bank-branches?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BRANCH`

**Body:**
**req obj:**
```json
{
    "bnkcode": "35",
    "brnname": "MCP Branch"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"bnkcode":&nbsp;"35",<br>&nbsp;&nbsp;"brncode":&nbsp;"1",<br>&nbsp;&nbsp;"brnname":&nbsp;"MCP&nbsp;Branch"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"bnkcode":&nbsp;"35",<br>&nbsp;&nbsp;"brncode":&nbsp;"2",<br>&nbsp;&nbsp;"brnname":&nbsp;"MCP&nbsp;Branch"<br>}</pre> |

---

### Route: POST /reference/qualifications?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_QUALIFICATION`

**Body:**
**req obj:**
```json
{
    "descr": "MCP Qual"
}
```

| res obj for local (Status: 200) | res obj for live (Status: 200) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Qual"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"success",<br>&nbsp;&nbsp;"descr":&nbsp;"MCP&nbsp;Qual"<br>}</pre> |

---

### Route: PUT /reference/shifts/Z5?compc=1&admin_card_no=100001.1
**Database Table(s):** `SHIFT_HEAD`

**Body:**
**req obj:**
```json
{
    "shift": "Z5",
    "shift_desc": "Updated Shift"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 422) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"ERROR",<br>&nbsp;&nbsp;"message":&nbsp;"Invalid&nbsp;input&nbsp;data",<br>&nbsp;&nbsp;"errors":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"origin":&nbsp;"string",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"invalid_format",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"format":&nbsp;"regex",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pattern":&nbsp;"/^\\d+$/",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"path":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"params",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;],<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"message":&nbsp;"Input&nbsp;should&nbsp;be&nbsp;a&nbsp;valid&nbsp;integer,&nbsp;unable&nbsp;to&nbsp;parse&nbsp;string&nbsp;as&nbsp;an&nbsp;integer"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"type":&nbsp;"int_parsing",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"loc":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"path",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;],<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"msg":&nbsp;"Input&nbsp;should&nbsp;be&nbsp;a&nbsp;valid&nbsp;integer,&nbsp;unable&nbsp;to&nbsp;parse&nbsp;string&nbsp;as&nbsp;an&nbsp;integer",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"input":&nbsp;"Z5"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> |

---

### Route: DELETE /reference/shifts/Z5?compc=1&admin_card_no=100001.1
**Database Table(s):** `SHIFT_HEAD`

**Body:**
**req obj:** None

| res obj for local (Status: 400) | res obj for live (Status: 422) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"status":&nbsp;"ERROR",<br>&nbsp;&nbsp;"message":&nbsp;"Invalid&nbsp;input&nbsp;data",<br>&nbsp;&nbsp;"errors":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"origin":&nbsp;"string",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"code":&nbsp;"invalid_format",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"format":&nbsp;"regex",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pattern":&nbsp;"/^\\d+$/",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"path":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"params",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;],<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"message":&nbsp;"Input&nbsp;should&nbsp;be&nbsp;a&nbsp;valid&nbsp;integer,&nbsp;unable&nbsp;to&nbsp;parse&nbsp;string&nbsp;as&nbsp;an&nbsp;integer"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;{<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"type":&nbsp;"int_parsing",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"loc":&nbsp;[<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"path",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pk"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;],<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"msg":&nbsp;"Input&nbsp;should&nbsp;be&nbsp;a&nbsp;valid&nbsp;integer,&nbsp;unable&nbsp;to&nbsp;parse&nbsp;string&nbsp;as&nbsp;an&nbsp;integer",<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"input":&nbsp;"Z5"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;]<br>}</pre> |

---

### Route: PUT /reference/locations/9957?compc=1&admin_card_no=100001.1
**Database Table(s):** `COM_LOCATION`

**Body:**
**req obj:**
```json
{
    "lcode": "9957",
    "descr": "Updated Loc"
}
```

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Location&nbsp;9957&nbsp;not&nbsp;found"<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Location&nbsp;9957&nbsp;not&nbsp;found"<br>}</pre> |

---

### Route: DELETE /reference/emp-statuses/38?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_STATUS`

**Body:**
**req obj:** None

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;entries&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;entries&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> |

---

### Route: DELETE /reference/bank-branches/35/35?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BRANCH`

**Body:**
**req obj:** None

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;branches&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;branches&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> |

---

### Route: DELETE /reference/banks/35?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_BANK`, `HR_BRANCH` (cascade deletion of bank branches)

**Body:**
**req obj:** None

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;banks&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;banks&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> |

---

### Route: DELETE /reference/qualifications/Dummy%20Qual%20570?compc=1&admin_card_no=100001.1
**Database Table(s):** `HR_EMP_QUALIFICATION`

**Body:**
**req obj:** None

| res obj for local (Status: 400) | res obj for live (Status: 400) |
| :--- | :--- |
| <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;options&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> | <pre>{<br>&nbsp;&nbsp;"detail":&nbsp;"Only&nbsp;options&nbsp;added&nbsp;for&nbsp;this&nbsp;company&nbsp;can&nbsp;be&nbsp;removed."<br>}</pre> |

---

