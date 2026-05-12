"use client";

import { Download } from "lucide-react";

type ExportRow = Record<string, unknown>;

export function ExportButton({ data, filename, columns }: { data: ExportRow[], filename: string, columns: { label: string, key: string }[] }) {
  const handleExport = () => {
    const header = columns.map((col) => col.label).join(",");
    const rows = data.map((item) =>
      columns
        .map((col) => {
          const value = resolveColumnValue(item, col.key);
          const formattedValue = value instanceof Date ? value.toLocaleString() : value;
          return `"${String(formattedValue ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport} className="btn secondary gap-2 flex items-center">
      <Download size={16} />
      Export CSV
    </button>
  );
}

function resolveColumnValue(row: ExportRow, key: string) {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as ExportRow)[segment];
  }, row);
}
