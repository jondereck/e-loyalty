"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type AnalyticsData = {
  date: string;
  visits: number;
  points: number;
};

export function VisitTrendChart({ data }: { data: AnalyticsData[] }) {
  return (
    <div style={{ width: "100%", height: 300, marginTop: 20 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => str.slice(5)}
            fontSize={12}
            tick={{ fill: "#666" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            fontSize={12}
            tick={{ fill: "#666" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Line
            type="monotone"
            dataKey="visits"
            stroke="#8884d8"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8884d8", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            name="Visits"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PointsChart({ data }: { data: AnalyticsData[] }) {
  return (
    <div style={{ width: "100%", height: 300, marginTop: 20 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => str.slice(5)}
            fontSize={12}
            tick={{ fill: "#666" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            fontSize={12}
            tick={{ fill: "#666" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Legend />
          <Bar
            dataKey="points"
            fill="#82ca9d"
            radius={[4, 4, 0, 0]}
            name="Points Earned"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
