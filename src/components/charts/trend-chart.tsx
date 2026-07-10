"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Point = { date: string; inbound: number; completed: number };

export function TrendChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gInbound" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(new Date(d), "MMM d")}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem",
            fontSize: "12px",
            boxShadow: "0 8px 28px -6px rgb(16 24 40 / 0.16)",
          }}
          labelFormatter={(d) => format(new Date(d as string), "EEE, MMM d")}
        />
        <Area type="monotone" dataKey="inbound" name="Inbound" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gInbound)" />
        <Area type="monotone" dataKey="completed" name="Completed" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gCompleted)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
