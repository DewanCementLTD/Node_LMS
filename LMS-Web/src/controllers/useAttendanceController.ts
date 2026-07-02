"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAttendanceRange, fetchAttendanceSummary } from "@/services/attendanceService";
import { AttendanceRecord, AttendanceSummary } from "@/models/attendance";

export function useAttendanceController() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toLocal(firstDay), to: toLocal(now) };
  });

  const loadAttendance = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const reportRes = await fetchAttendanceRange(user.card_no, dateRange.from, dateRange.to);
      const items = (reportRes.items || []).map((r) => ({
        ...r,
        day_name: r.day_name || (r.roster_date
          ? new Date(r.roster_date).toLocaleDateString("en-US", { weekday: "long" })
          : undefined),
      }));
      setRecords(items);

      try {
        const summaryRes = await fetchAttendanceSummary(user.card_no, dateRange.from, dateRange.to);
        setSummary(summaryRes.body);
      } catch {
        // Summary not available
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  return {
    records,
    summary,
    loading,
    error,
    dateRange,
    setDateRange,
    refresh: loadAttendance,
  };
}
