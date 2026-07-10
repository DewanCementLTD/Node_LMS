"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { LeaveBalance } from "@/models/leave";

// Categorical palette, fixed slot order (CVD-validated on white: worst adjacent
// ΔE 24.2). Never cycled — more than 8 types folds into the last slot's "Other".
const SERIES_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

interface LeaveBalanceChartProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceChart({ balances }: LeaveBalanceChartProps) {
  // Only show leaves with positive balance — negative means 0 available
  const data = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({
      name: b.leave_desc || `Type ${b.leave_type}`,
      value: Math.max(0, b.balance),
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No leave balance data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div style={{ width: "100%", height: 192 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={SERIES_COLORS[Math.min(index, SERIES_COLORS.length - 1)]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value ?? 0} day${Number(value) === 1 ? "" : "s"}`,
                String(name ?? ""),
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend: identity + value in text ink — the colored swatch carries the
          series identity, the text never wears the series color. */}
      <ul className="mt-3 space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-[3px] shrink-0"
              style={{ background: SERIES_COLORS[Math.min(i, SERIES_COLORS.length - 1)] }}
            />
            <span className="text-gray-600 truncate flex-1">{d.name}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{d.value}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs border-t border-gray-100 pt-1.5 mt-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0" />
          <span className="text-gray-500 flex-1">Total available</span>
          <span className="font-semibold text-gray-900 tabular-nums">{total}</span>
        </li>
      </ul>
    </div>
  );
}
