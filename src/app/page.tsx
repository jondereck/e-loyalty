import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Gift,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundPlus,
  Zap,
} from "lucide-react";
import { HomeMobileMenu } from "@/components/home/HomeMobileMenu";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

const navLinks = [
  { href: "/", label: "Home", active: true },
  { href: "/#card-preview", label: "Card" },
  { href: "/#rewards-preview", label: "Rewards" },
  { href: "/login", label: "Login" },
];

const proofItems = [
  { icon: ShieldCheck, label: "100% Secure" },
  { icon: Zap, label: "Instant & Easy" },
  { icon: Clock3, label: "Always Available" },
] satisfies { icon: LucideIcon; label: string }[];

const steps = [
  {
    number: "1",
    title: "Join in seconds",
    body: "Create your account and get your secure QR card.",
    icon: UserRoundPlus,
  },
  {
    number: "2",
    title: "Earn points",
    body: "Visit our store and earn points with every purchase.",
    icon: Star,
  },
  {
    number: "3",
    title: "Unlock rewards",
    body: "Redeem points for drinks, upgrades, and exclusive perks.",
    icon: Gift,
  },
  {
    number: "4",
    title: "Scan & enjoy",
    body: "Scan your QR at checkout and enjoy the benefits.",
    icon: QrCode,
  },
] satisfies { number: string; title: string; body: string; icon: LucideIcon }[];

const rewards = [
  { name: "Free drink", points: "1,000 pts", variant: "drink" },
  { name: "Premium upgrade", points: "2,500 pts", variant: "dessert" },
  { name: "VIP bundle", points: "5,000 pts", variant: "bundle" },
] as const;

const trustItems = [
  { icon: ShieldCheck, title: "Bank-level security", body: "Your data is always protected." },
  { icon: LockKeyhole, title: "Your points are safe", body: "Point will stay forever." },
  { icon: Zap, title: "Easy & reliable", body: "Built for speed and simplicity." },
  { icon: Star, title: "Loved by members", body: "Thousands of 5-star reviews." },
] satisfies { icon: LucideIcon; title: string; body: string }[];

export default async function Home() {
  const user = await getAuthUser();
  if (user) {
    const profile = await getCurrentProfile();
    if (!profile) redirect("/complete-profile");
    if (profile.status !== "ACTIVE") redirect("/login?error=suspended");
    redirect(redirectForRoles(profile.roles));
  }

  return (
    <main className="lp-home">
      <span id="card-preview" className="lp-home-anchor" aria-hidden="true" />
      <DesktopHomepage />
      <MobileHomepage />
    </main>
  );
}

function DesktopHomepage() {
  return (
    <section className="lp-home-desktop" aria-label="Loyalty Pass homepage desktop view">
      <div className="lp-home-desktop-shell">
        <DesktopNav />

        <section className="lp-home-hero">
          <div className="lp-home-hero-copy">
            <Eyebrow />
            <HeroHeading align="left" />
            <HeroLead />
            <ProofList />
            <CtaRow />
            <MemberProof />
          </div>

          <div className="lp-home-hero-visual" aria-hidden="true">
            <Image
              className="lp-home-hero-image"
              src="/homepage/phone-hero.png"
              alt=""
              width={1254}
              height={1254}
              priority
            />
          </div>
        </section>

        <HowItWorksDesktop />
        <RewardsPreview />
        <DesktopTrustStrip />
      </div>
    </section>
  );
}

function MobileHomepage() {
  return (
    <section className="lp-home-mobile" aria-label="Loyalty Pass homepage mobile view">
      <div className="lp-home-mobile-shell">
        <div className="lp-home-mobile-status" aria-hidden="true">
          <span>9:41</span>
          <span>LTE</span>
        </div>

        <header className="lp-home-mobile-header">
          <Link className="lp-home-brand" href="/">
            <BrandLogo />
            <span>Loyalty Pass</span>
          </Link>
          <HomeMobileMenu />
        </header>

        <section className="lp-home-mobile-hero">
          <Eyebrow />
          <HeroHeading align="center" />
          <HeroLead />
          <ProofList />
          <CtaColumn />
        </section>

        <PassCard />
        <MemberProof />
        <HowItWorksMobile />
        <CtaColumn />
      </div>
    </section>
  );
}

function DesktopNav() {
  return (
    <header className="lp-home-nav">
      <Link className="lp-home-brand" href="/">
        <BrandLogo />
        <span>Loyalty Pass</span>
      </Link>

      <nav className="lp-home-nav-links" aria-label="Homepage navigation">
        {navLinks.map((link) => (
          <Link key={link.href} className={link.active ? "active" : undefined} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link className="lp-home-nav-cta" href="/signup">
          Sign up
        </Link>
      </nav>
    </header>
  );
}

function BrandLogo() {
  return <span className="lp-home-logo">L</span>;
}

function Eyebrow() {
  return (
    <div className="lp-home-eyebrow">
      <Sparkles size={14} />
      <span>Digital loyalty for modern businesses</span>
    </div>
  );
}

function HeroHeading({ align }: { align: "left" | "center" }) {
  return (
    <h1 className={`lp-home-heading ${align === "center" ? "center" : ""}`}>
      Point will stay <span>forever</span>
    </h1>
  );
}

function HeroLead() {
  return (
    <p className="lp-home-lead">
      Earn points, unlock amazing rewards, and enjoy exclusive perks {"\u2014"} all with your secure QR card.
    </p>
  );
}

function ProofList() {
  return (
    <div className="lp-home-proof-list">
      {proofItems.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.label}>
            <Icon size={16} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

function CtaRow() {
  return (
    <div className="lp-home-actions">
      <Link className="lp-home-primary-button" href="/signup">
        Join now <ArrowRight size={18} />
      </Link>
      <Link className="lp-home-secondary-button" href="/login">
        Login
      </Link>
    </div>
  );
}

function CtaColumn() {
  return (
    <div className="lp-home-mobile-actions">
      <Link className="lp-home-primary-button" href="/signup">
        Join now <ArrowRight size={18} />
      </Link>
      <Link className="lp-home-secondary-button" href="/login">
        Login
      </Link>
    </div>
  );
}

function MemberProof() {
  return (
    <div className="lp-home-member-proof">
      <div className="lp-home-avatars" aria-hidden="true">
        <span className="avatar-one" />
        <span className="avatar-two" />
        <span className="avatar-three" />
        <span className="avatar-four" />
      </div>
      <div className="lp-home-member-copy">
        <span>Join thousands of happy members</span>
        <strong>
          <StarRow /> 4.9/5 from 2,500+ members
        </strong>
      </div>
    </div>
  );
}

function StarRow() {
  return (
    <span className="lp-home-stars" aria-label="Five star rating">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={13} fill="currentColor" />
      ))}
    </span>
  );
}

function PassCard({ className = "" }: { className?: string }) {
  return (
    <div className={`lp-home-pass-card ${className}`}>
      <span className="lp-home-tier">Gold</span>
      <strong>Loyalty Pass</strong>
      <div className="lp-home-pass-stats">
        <span>
          <b>2,480</b>
          Points Balance
        </span>
        <span>
          <b>18</b>
          Visits
        </span>
      </div>
    </div>
  );
}

function HowItWorksDesktop() {
  return (
    <section className="lp-home-section lp-home-how">
      <div className="lp-home-section-head">
        <h2>How it works</h2>
        <p>Simple steps. Big rewards.</p>
      </div>

      <div className="lp-home-step-grid">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div className="lp-home-step-card" key={step.number}>
              <span className="lp-home-step-number">{step.number}</span>
              <Icon size={28} />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {index < steps.length - 1 ? <ArrowRight className="lp-home-step-arrow" size={24} /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorksMobile() {
  return (
    <section className="lp-home-mobile-how">
      <div className="lp-home-section-head">
        <h2>How it works</h2>
        <p>Simple steps. Big rewards.</p>
      </div>

      <div className="lp-home-mobile-step-list">
        {steps.map((step) => (
          <Link className="lp-home-mobile-step" href="/signup" key={step.number}>
            <span className="lp-home-step-number">{step.number}</span>
            <span>
              <strong>{step.title}</strong>
              <small>{step.body}</small>
            </span>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RewardsPreview() {
  return (
    <section className="lp-home-rewards" id="rewards-preview">
      <div className="lp-home-rewards-head">
        <h2>Rewards you&apos;ll love</h2>
        <Link href="/#rewards-preview">
          View all rewards <ArrowRight size={15} />
        </Link>
      </div>

      <div className="lp-home-reward-grid">
        {rewards.map((reward) => (
          <article className="lp-home-reward-card" key={reward.name}>
            <div className={`lp-home-reward-art ${reward.variant}`} aria-hidden="true" />
            <h3>{reward.name}</h3>
            <p>{reward.points}</p>
          </article>
        ))}

        <article className="lp-home-more-rewards">
          <Gift size={42} />
          <strong>More rewards</strong>
          <span>coming soon</span>
        </article>
      </div>
    </section>
  );
}

function DesktopTrustStrip() {
  return (
    <section className="lp-home-trust-strip" aria-label="Loyalty Pass trust highlights">
      {trustItems.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title}>
            <Icon size={34} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
