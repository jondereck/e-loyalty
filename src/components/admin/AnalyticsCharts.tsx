"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";

type AnalyticsData = {
  date: string;
  visits: number;
  points: number;
};

export function VisitTrendChart({ data }: { data: AnalyticsData[] }) {
  return (
    <div style={{ width: "100%", height: 260, padding: "10px 0" }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5d51ff" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#5d51ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => {
              const parts = str.split("-");
              const m = parts[1];
              const d = parts[2];
              return `${m}/${d}`;
            }}
            fontSize={11}
            tick={{ fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            fontSize={11}
            tick={{ fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              fontSize: 12,
              fontWeight: 600
            }}
          />
          <Area
            type="monotone"
            dataKey="visits"
            stroke="#5d51ff"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#visitGradient)"
            name="Visits"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PointsChart({ data }: { data: AnalyticsData[] }) {
  return (
    <div style={{ width: "100%", height: 260, padding: "10px 0" }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={0}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => {
              const parts = str.split("-");
              const m = parts[1];
              const d = parts[2];
              return `${m}/${d}`;
            }}
            fontSize={11}
            tick={{ fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            fontSize={11}
            tick={{ fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              fontSize: 12,
              fontWeight: 600
            }}
          />
          <Bar
            dataKey="points"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            name="Points"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.points > 0 ? "#10b981" : "#e2e8f0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
