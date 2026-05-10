"use client";

import { Download } from "lucide-react";

export function ExportButton({ data, filename, columns }: { data: any[], filename: string, columns: { label: string, key: string }[] }) {
  const handleExport = () => {
    const header = columns.map((col) => col.label).join(",");
    const rows = data.map((item) =>
      columns
        .map((col) => {
          const value = col.key.split(".").reduce((obj, key) => obj?.[key], item);
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
