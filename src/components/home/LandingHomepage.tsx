"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Gift,
  LockKeyhole,
  Menu,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundPlus,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";

type AuthMode = "login" | "signup";

const authTransition: Transition = {
  duration: 0.58,
  ease: [0.22, 1, 0.36, 1],
};

const navLinks = [
  { href: "/#card-preview", label: "Card" },
  { href: "/#rewards-preview", label: "Rewards" },
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

const mobileSteps = [
  {
    number: "1",
    title: "Join",
    body: "Create your free account.",
    icon: UserRoundPlus,
  },
  {
    number: "2",
    title: "Scan",
    body: "Show your QR card at checkout.",
    icon: QrCode,
  },
  {
    number: "3",
    title: "Earn rewards",
    body: "Collect points and redeem rewards.",
    icon: Gift,
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

export function LandingHomepage() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
  }

  function closeAuth() {
    setAuthMode(null);
  }

  return (
    <>
      <span id="card-preview" className="lp-home-anchor" aria-hidden="true" />
      <DesktopHomepage authMode={authMode} openAuth={openAuth} closeAuth={closeAuth} />
      <MobileHomepage authMode={authMode} openAuth={openAuth} closeAuth={closeAuth} />
    </>
  );
}

function DesktopHomepage({
  authMode,
  openAuth,
  closeAuth,
}: {
  authMode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
}) {
  const isAuth = authMode !== null;

  return (
    <section className="lp-home-desktop" aria-label="Loyalty Pass homepage desktop view">
      <div className="lp-home-desktop-shell">
        <DesktopNav activeAuthMode={authMode} openAuth={openAuth} closeAuth={closeAuth} />

        <section className={`lp-home-hero ${isAuth ? "is-auth" : ""}`}>
          <AnimatePresence initial={false} mode="popLayout">
            {!isAuth ? (
              <motion.div
                key="hero-copy"
                className="lp-home-hero-copy"
                initial={{ opacity: 0, x: -26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -36 }}
                transition={authTransition}
              >
                <Eyebrow />
                <HeroHeading align="left" />
                <HeroLead />
                <ProofList />
                <CtaRow openAuth={openAuth} />
                <MemberProof />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div className="lp-home-hero-visual" aria-hidden="true" layout transition={authTransition}>
            <Image
              className="lp-home-hero-image"
              src="/homepage/phone-hero.png"
              alt=""
              width={1254}
              height={1254}
              priority
            />
          </motion.div>

          <AnimatePresence initial={false} mode="wait">
            {authMode ? <AuthPanel key={authMode} mode={authMode} setMode={openAuth} closeAuth={closeAuth} /> : null}
          </AnimatePresence>
        </section>

        <HowItWorksDesktop />
        <RewardsPreview />
        <DesktopTrustStrip />
      </div>
    </section>
  );
}

function MobileHomepage({
  authMode,
  openAuth,
  closeAuth,
}: {
  authMode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
}) {
  const isAuth = authMode !== null;
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    if (isAuth) return;

    function updateStickyCta() {
      setShowStickyCta(window.scrollY > 320);
    }

    const frame = window.requestAnimationFrame(updateStickyCta);
    window.addEventListener("scroll", updateStickyCta, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateStickyCta);
    };
  }, [isAuth]);

  return (
    <section className="lp-home-mobile" aria-label="Loyalty Pass homepage mobile view">
      <div className={`lp-home-mobile-shell ${isAuth ? "is-auth" : ""}`}>
        <header className="lp-home-mobile-header">
          <button className="lp-home-brand lp-home-brand-button" type="button" onClick={closeAuth}>
            <BrandLogo />
            <span>Loyalty Pass</span>
          </button>
          <MobileNav activeAuthMode={authMode} openAuth={openAuth} closeAuth={closeAuth} />
        </header>

        <AnimatePresence initial={false} mode="wait">
          {!isAuth ? (
            <motion.div
              key="mobile-home"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={authTransition}
            >
              <section className="lp-home-mobile-hero">
                <Eyebrow />
                <HeroHeading align="center" copy="Your rewards, always in your pocket." />
                <HeroLead copy="Join for free, get your secure QR loyalty card, and start earning points instantly." />
                <ProofList />
                <CtaColumn openAuth={openAuth} showTrustText />
              </section>

              <MobilePassPreview />
              <MemberProof />
              <HowItWorksMobile openAuth={openAuth} />
              <CtaColumn openAuth={openAuth} />
            </motion.div>
          ) : (
            <motion.div
              key={`mobile-auth-${authMode}`}
              className="lp-home-mobile-auth"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={authTransition}
            >
              <AuthPanel mode={authMode} setMode={openAuth} closeAuth={closeAuth} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStickyCta && !isAuth ? <MobileStickyCta openAuth={openAuth} /> : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function DesktopNav({
  activeAuthMode,
  openAuth,
  closeAuth,
}: {
  activeAuthMode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
}) {
  return (
    <header className="lp-home-nav">
      <button className="lp-home-brand lp-home-brand-button" type="button" onClick={closeAuth}>
        <BrandLogo />
        <span>Loyalty Pass</span>
      </button>

      <nav className="lp-home-nav-links" aria-label="Homepage navigation">
        <button className={activeAuthMode ? undefined : "active"} type="button" onClick={closeAuth}>
          Home
        </button>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={closeAuth}>
            {link.label}
          </Link>
        ))}
        <button className={activeAuthMode === "login" ? "active" : undefined} type="button" onClick={() => openAuth("login")}>
          Login
        </button>
        <button className="lp-home-nav-cta" type="button" onClick={() => openAuth("signup")}>
          Sign up
        </button>
      </nav>
    </header>
  );
}

function MobileNav({
  activeAuthMode,
  openAuth,
  closeAuth,
}: {
  activeAuthMode: AuthMode | null;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function run(action: () => void) {
    action();
    setIsOpen(false);
  }

  return (
    <div className="lp-home-mobile-menu">
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="lp-home-mobile-menu-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.nav
            id="lp-home-mobile-menu-panel"
            aria-label="Mobile homepage navigation"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <button className={activeAuthMode ? undefined : "active"} type="button" onClick={() => run(closeAuth)}>
              Home
            </button>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => run(closeAuth)}>
                {link.label}
              </Link>
            ))}
            <button type="button" onClick={() => run(() => openAuth("login"))}>
              Login
            </button>
            <button type="button" onClick={() => run(() => openAuth("signup"))}>
              Sign up
            </button>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AuthPanel({
  mode,
  setMode,
  closeAuth,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  closeAuth: () => void;
}) {
  const isLogin = mode === "login";

  return (
    <motion.section
      className="lp-home-auth-panel"
      aria-label={isLogin ? "Login form" : "Signup form"}
      layout
      initial={{ opacity: 0, x: 46 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 38 }}
      transition={authTransition}
    >
      <button className="lp-home-auth-close" type="button" aria-label="Return to home" onClick={closeAuth}>
        <X size={18} />
      </button>
      <div className="lp-home-auth-head">
        <span className="lp-home-auth-kicker">{isLogin ? "Welcome back" : "Join Loyalty Pass"}</span>
        <h2>{isLogin ? "Login" : "Create account"}</h2>
        <p>{isLogin ? "Sign in to continue earning and redeeming rewards." : "Create your account and get your secure QR card."}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {isLogin ? <LoginForm /> : <SignupForm />}
        </motion.div>
      </AnimatePresence>

      <p className="lp-home-auth-toggle">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button type="button" onClick={() => setMode(isLogin ? "signup" : "login")}>
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </motion.section>
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

function HeroHeading({ align, copy }: { align: "left" | "center"; copy?: string }) {
  if (!copy) {
    return (
      <h1 className={`lp-home-heading ${align === "center" ? "center" : ""}`}>
        Point will stay <span>forever</span>
      </h1>
    );
  }

  const [firstLine, ...rest] = copy.split(" ");
  const emphasis = rest.join(" ");

  return (
    <h1 className={`lp-home-heading ${align === "center" ? "center" : ""}`}>
      {firstLine} <span>{emphasis}</span>
    </h1>
  );
}

function HeroLead({
  copy = "Earn points, unlock amazing rewards, and enjoy exclusive perks \u2014 all with your secure QR card.",
}: {
  copy?: string;
}) {
  return (
    <p className="lp-home-lead">
      {copy}
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

function CtaRow({ openAuth }: { openAuth: (mode: AuthMode) => void }) {
  return (
    <div className="lp-home-actions">
      <button className="lp-home-primary-button" type="button" onClick={() => openAuth("signup")}>
        Join now <ArrowRight size={18} />
      </button>
      <button className="lp-home-secondary-button" type="button" onClick={() => openAuth("login")}>
        Login
      </button>
    </div>
  );
}

function CtaColumn({
  openAuth,
  showTrustText = false,
}: {
  openAuth: (mode: AuthMode) => void;
  showTrustText?: boolean;
}) {
  return (
    <div className="lp-home-mobile-actions">
      <button className="lp-home-primary-button" type="button" onClick={() => openAuth("signup")}>
        Create my free card <ArrowRight size={18} />
      </button>
      <button className="lp-home-secondary-button" type="button" onClick={() => openAuth("login")}>
        I already have an account
      </button>
      {showTrustText ? <p className="lp-home-cta-trust">Free to join {"\u2022"} Takes less than 30 seconds</p> : null}
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
    <LoyaltyCard
      variant="homepage"
      tier="Gold"
      points={2480}
      visits={18}
      systemName="Loyalty Pass"
      className={className}
    />
  );
}

function MobilePassPreview() {
  return (
    <section className="lp-home-mobile-card-preview" aria-label="Digital loyalty card preview">
      <span>Your digital loyalty card</span>
      <PassCard className="lp-home-mobile-pass-card" />
    </section>
  );
}

function MobileStickyCta({ openAuth }: { openAuth: (mode: AuthMode) => void }) {
  return (
    <motion.div
      className="lp-home-sticky-cta"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <button className="lp-home-primary-button" type="button" onClick={() => openAuth("signup")}>
        Create my free card
      </button>
      <button className="lp-home-sticky-login" type="button" onClick={() => openAuth("login")}>
        Login
      </button>
    </motion.div>
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

function HowItWorksMobile({ openAuth }: { openAuth: (mode: AuthMode) => void }) {
  return (
    <section className="lp-home-mobile-how">
      <div className="lp-home-section-head">
        <h2>How it works</h2>
        <p>Simple steps. Big rewards.</p>
      </div>

      <div className="lp-home-mobile-step-list">
        {mobileSteps.map((step) => {
          const Icon = step.icon;
          return (
            <button className="lp-home-mobile-step" type="button" onClick={() => openAuth("signup")} key={step.number}>
              <span className="lp-home-step-number">
                <Icon size={14} />
              </span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.body}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
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
