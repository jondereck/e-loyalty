import { Badge } from "@/components/ui/Badge";

export function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status ?? "UNKNOWN";
  const tone =
    normalized.includes("APPROVED") || normalized === "ACTIVE" || normalized === "AVAILABLE"
      ? "green"
      : normalized.includes("PENDING") || normalized === "MAINTENANCE" || normalized === "LOCKED"
        ? "orange"
        : normalized.includes("REJECTED") || normalized.includes("BLOCKED") || normalized === "INACTIVE"
          ? "red"
          : "purple";

  return <Badge tone={tone}>{normalized.replaceAll("_", " ")}</Badge>;
}

