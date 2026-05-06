import { AppNav } from "@/components/AppNav";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DesignSystemPage() {
  return (
    <>
      <AppNav />
      <main className="container section">
        <div className="eyebrow">Design System</div>
        <h2>Loyalty Pass UI</h2>
        <div className="grid three">
          <Card><h3>Buttons</h3><div className="actions"><ButtonLink href="/" variant="primary">Primary</ButtonLink><ButtonLink href="/" variant="secondary">Secondary</ButtonLink></div></Card>
          <Card><h3>Badges</h3><div className="actions"><Badge tone="green">Active</Badge><Badge tone="orange">Pending</Badge><Badge tone="red">Blocked</Badge></div></Card>
          <Card><h3>Surfaces</h3><p className="muted">Glass cards, compact rows, phone frames, tables, and metrics are converted from `public/design`.</p></Card>
        </div>
      </main>
    </>
  );
}

