"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { applyLeave, fetchLeaveStatus, fetchLeaveTypes } from "@/services/leaveService";
import { fetchLeaveBalances } from "@/services/authService";
import { fetchDashboard } from "@/services/authService";
import { LeaveApplyRequest, LeaveApplication, LeaveBalance, LeaveType } from "@/models/leave";

export function useLeaveController() {
  const { user } = useAuth();
  const [leaveHistory, setLeaveHistory] = useState<LeaveApplication[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLeaveData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [statusRes, balRes, typesRes] = await Promise.all([
        fetchLeaveStatus(user.card_no),
        fetchLeaveBalances(user.card_no),
        fetchLeaveTypes(user.card_no),
      ]);
      setLeaveHistory(statusRes.items || []);
      setLeaveBalances(balRes.items || []);
      setLeaveTypes(typesRes.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  async function submitLeave(data: Omit<LeaveApplyRequest, "compc" | "brnch" | "emp_name">) {
    if (!user) return;

    // Balance pre-check against the selected LEAVE_TYPES row. OD ("out door
    // duty") types have no balance restriction; unknown balances (null) are
    // left for the backend to validate.
    const selected = leaveTypes.find((t) => t.leave_type_pk === data.leave_type_id);
    if (selected && !selected.is_od && selected.balance !== null) {
      const requestedDays = data.half_day
        ? 0.5
        : Math.floor(
            (new Date(data.to_date).getTime() - new Date(data.from_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
      if (selected.balance <= 0) {
        setError("You have no remaining balance for this leave type.");
        return;
      }
      if (requestedDays > selected.balance) {
        setError(
          `Insufficient balance. You have ${selected.balance} day(s) but requested ${requestedDays} day(s).`
        );
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const dashData = await fetchDashboard(user.card_no);
      const request: LeaveApplyRequest = {
        ...data,
        compc: Number(dashData.compc) || 1,
        brnch: Number(dashData.branch) || 1,
        emp_name: user.emp_name,
      };
      const res = await applyLeave(user.card_no, request);
      setSuccess(res.message || "Leave applied successfully");
      await loadLeaveData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    leaveHistory,
    leaveBalances,
    leaveTypes,
    loading,
    submitting,
    error,
    success,
    submitLeave,
    refresh: loadLeaveData,
    clearMessages: () => { setError(null); setSuccess(null); },
  };
}
