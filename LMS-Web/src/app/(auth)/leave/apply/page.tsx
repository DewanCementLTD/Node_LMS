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
import { CalendarPlus, TreePalm } from "lucide-react";

export default function ApplyLeavePage() {
  const {
    leaveBalances,
    leaveTypes,
    loading,
    submitting,
    error,
    success,
    submitLeave,
    clearMessages,
  } = useLeaveController();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<"first" | "second">("first");

  function resetForm() {
    setFromDate("");
    setToDate("");
    setLeaveType("");
    setReason("");
    setHalfDay(false);
    setHalfDaySession("first");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();
    const effectiveToDate = halfDay ? fromDate : toDate;
    if (!fromDate || !effectiveToDate || !leaveType || !reason.trim()) return;
    const numericType = parseInt(leaveType);
    submitLeave({
      from_date: fromDate,
      to_date: effectiveToDate,
      leave_type_id: isNaN(numericType) ? 0 : numericType,
      half_day: halfDay,
      half_day_session: halfDay ? halfDaySession : undefined,
      reason: reason.trim(),
    });
  }

  function handleSuccess() {
    resetForm();
    clearMessages();
  }

  if (loading) return <Spinner />;

  // Every applyable type from LEAVE_TYPES — value is the unique numeric PK.
  const leaveOptions = leaveTypes
    .filter((lt) => lt.leave_type_pk !== null)
    .map((lt) => ({
      value: String(lt.leave_type_pk),
      label:
        (lt.leave_desc || `Type ${lt.leave_type}`) +
        (lt.is_od
          ? ""
          : lt.balance !== null
          ? ` (Balance: ${lt.balance})`
          : ""),
    }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a new leave request"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Application form */}
        <div className="lg:col-span-2">
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
                  <Alert type="success" message={success} onClose={handleSuccess} />
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                <Select
                  label="Leave Type"
                  options={leaveOptions}
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  required
                />

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={halfDay}
                    onChange={(e) => setHalfDay(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Half day (0.5 day, single date)</span>
                </label>

                {halfDay && (
                  <Select
                    label="Half Day Session"
                    options={[
                      { value: "first", label: "First Half (09:30 – 13:00)" },
                      { value: "second", label: "Second Half (13:00 – 18:00)" },
                    ]}
                    value={halfDaySession}
                    onChange={(e) => setHalfDaySession(e.target.value as "first" | "second")}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={halfDay ? "Date" : "From Date"}
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                  {!halfDay && (
                    <Input
                      label="To Date"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate}
                      required
                    />
                  )}
                </div>

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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      resetForm();
                      clearMessages();
                    }}
                  >
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

        {/* Leave balances widget */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TreePalm className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Leave Balances</h2>
            </div>
          </CardHeader>
          <CardContent>
            {leaveBalances.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No leave balance data available</p>
            ) : (
              <div className="space-y-3">
                {leaveBalances.map((lb, i) => {
                  const displayBalance = Math.max(0, lb.balance);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm text-gray-600">
                        {lb.leave_desc || `Type ${lb.leave_type}`}
                      </p>
                      <p className={`text-lg font-bold ${displayBalance > 0 ? "text-indigo-600" : "text-gray-400"}`}>
                        {displayBalance}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
