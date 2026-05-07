import { ArrowRight, BadgeCheck, Gift, QrCode } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";

export default function Home() {
  return (
    <>
      <AppNav active="home" />
      <main className="container">
        <section className="hero" id="card-preview">
          <div>
            <div className="eyebrow">Digital loyalty for branch teams</div>
            <h1>Loyalty Pass</h1>
            <p className="lead">
              Customers earn once per business day with a secure QR card. Cashiers scan, the system validates, and admins review exceptions.
            </p>
            <div className="actions">
              <ButtonLink href="/login" variant="secondary">
                Login
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary">
                Sign up <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </div>
          <div>
            <LoyaltyCard tier="Gold" points={2480} visits={18} />
            <div className="grid two" style={{ marginTop: 18 }}>
              <Card>
                <QrCode />
                <h3>Scan</h3>
                <p className="muted">Cashier resolves the customer QR token at the branch.</p>
              </Card>
              <Card>
                <BadgeCheck />
                <h3>Validate</h3>
                <p className="muted">Duplicate, branch, cashier, and active-card checks run before earning.</p>
              </Card>
            </div>
          </div>
        </section>
        <section className="section" id="how-it-works">
          <div className="grid three">
            {[
              ["1", "Create a card", "Signup creates the Neon Auth account, profile, card number, and secure QR token."],
              ["2", "Earn points", "Approved visits add 100 points and update the customer card summary."],
              ["3", "Redeem rewards", "Milestones unlock by points, with cashier-assisted redemption."],
            ].map(([step, title, body]) => (
              <Card key={step}>
                <span className="icon">{step}</span>
                <h3 style={{ marginTop: 14 }}>{title}</h3>
                <p className="muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>
        <section className="section" id="rewards-preview">
          <div className="grid two">
            <Card>
              <Gift />
              <h2>Rewards preview</h2>
              <div className="list">
                <div className="row"><strong>Free drink</strong><span className="badge green">1,000 pts</span></div>
                <div className="row"><strong>Premium upgrade</strong><span className="badge purple">2,500 pts</span></div>
                <div className="row"><strong>VIP bundle</strong><span className="badge orange">5,000 pts</span></div>
              </div>
            </Card>
            <Card>
              <h2>Ready for MVP</h2>
              <p className="muted">The functional slice includes registration, login, customer cards, cashier scanning, admin approvals, and point-ledger updates.</p>
              <div className="actions">
                <ButtonLink href="/signup" variant="primary">Create customer account</ButtonLink>
                <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <footer className="footer">Loyalty Pass MVP</footer>
    </>
  );
}

