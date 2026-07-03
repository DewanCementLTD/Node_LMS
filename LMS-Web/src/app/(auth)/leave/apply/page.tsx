"use client";

import { useState, FormEvent } from "react";
import { useLeaveController } from "@/controllers/useLeaveController";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { CalendarPlus, Clock } from "lucide-react";

const HALF_DAY_SESSIONS = [
  { value: "first", label: "First Half  (09:30 – 13:00)" },
  { value: "second", label: "Second Half (13:00 – 18:00)" },
];

export default function ApplyLeavePage() {
  const { leaveTypes, loading, submitting, error, success, submitLeave, clearMessages } =
    useLeaveController();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<"first" | "second">("first");

  const selectedType = leaveTypes.find((lt) => String(lt.leave_type) === leaveType);
  const isOD = selectedType?.is_od ?? false;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!fromDate || !leaveType || !reason.trim()) return;
    if (!halfDay && !toDate) return;

    submitLeave({
      from_date: fromDate,
      to_date: halfDay ? fromDate : toDate,
      type: leaveType,
      reason: reason.trim(),
      half_day: halfDay,
      half_day_session: halfDay ? halfDaySession : undefined,
    });
  }

  function handleReset() {
    setFromDate("");
    setToDate("");
    setLeaveType("");
    setReason("");
    setHalfDay(false);
    setHalfDaySession("first");
    clearMessages();
  }

  function handleLeaveTypeChange(val: string) {
    setLeaveType(val);
    // Reset half-day when switching types
    setHalfDay(false);
  }

  if (loading) return <Spinner />;

  // Build options from the LEAVE_TYPES LOV; OD shows "No limit", others show balance
  const leaveOptions = leaveTypes.map((lt) => {
    const code = String(lt.leave_type);
    const desc = lt.leave_desc || `Type ${lt.leave_type}`;
    const name = desc.toUpperCase().startsWith(code.toUpperCase()) ? desc : `${code} - ${desc}`;
    const balLabel = lt.is_od
      ? "No limit"
      : lt.balance != null
        ? `Balance: ${Math.max(0, lt.balance)}`
        : "Balance: 0";
    return {
      value: code,
      label: `${name} (${balLabel})`,
    };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a new leave request"
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Leave Application Form</h2>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4">
                <Alert type="error" message={error} onClose={clearMessages} />
              </div>
            )}
            {success && (
              <div className="mb-4">
                <Alert type="success" message={success} onClose={handleReset} />
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Leave Type */}
              <Select
                label="Leave Type"
                options={leaveOptions}
                value={leaveType}
                onChange={(e) => handleLeaveTypeChange(e.target.value)}
                required
              />

              {/* OD notice */}
              {isOD && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>OD (On Duty) leave can be applied without balance restrictions.</span>
                </div>
              )}

              {/* Half Day Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={halfDay}
                  onClick={() => setHalfDay((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${halfDay ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${halfDay ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Half Day Leave</span>
              </div>

              {/* Half Day Session Selector */}
              {halfDay && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-indigo-800">Select Session</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {HALF_DAY_SESSIONS.map((s) => (
                      <label
                        key={s.value}
                        className={`flex-1 flex items-center gap-3 cursor-pointer rounded-lg border-2 px-4 py-3 transition-colors ${halfDaySession === s.value
                          ? "border-indigo-500 bg-white"
                          : "border-gray-200 bg-white hover:border-indigo-300"
                          }`}
                      >
                        <input
                          type="radio"
                          name="halfDaySession"
                          value={s.value}
                          checked={halfDaySession === s.value}
                          onChange={() => setHalfDaySession(s.value as "first" | "second")}
                          className="accent-indigo-600"
                        />
                        <span className="text-sm font-medium text-gray-800">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date fields */}
              {halfDay ? (
                <Input
                  label="Date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="From Date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate}
                    required
                  />
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-all duration-200 min-h-[100px] resize-y"
                  placeholder="Enter your reason for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit" loading={submitting}>
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
