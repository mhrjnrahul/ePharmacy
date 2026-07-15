import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import {
  ChevronLeft, ChevronRight,
  ShieldCheck, Pill, Truck, FileText,
  Package, CheckCircle2,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { green, gray } from "./tokens"

// ── Right-side visuals ────────────────────────────────────────────────────────

const OrderVisual = () => (
  <div style={{ position: "relative" }}>
    <div style={{
      backgroundColor: "#fff", borderRadius: "20px",
      border: `1px solid ${gray[200]}`, padding: "24px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pill size={18} color={green[600]} />
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0 }}>Your Medicine Order</p>
          <p style={{ fontSize: "11px", color: gray[500], margin: 0 }}>Est. delivery: 2–4 hours</p>
        </div>
      </div>

      {[
        { name: "Paracetamol 500mg", qty: "×2 strips", price: "Rs. 90"  },
        { name: "Amoxicillin 250mg", qty: "×1 strip",  price: "Rs. 140" },
        { name: "Vitamin C 1000mg",  qty: "×1 bottle", price: "Rs. 350" },
      ].map((item, i, arr) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${gray[100]}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={11} color={green[600]} />
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: gray[900], margin: 0 }}>{item.name}</p>
              <p style={{ fontSize: "10px", color: gray[500], margin: 0 }}>{item.qty}</p>
            </div>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: green[600] }}>{item.price}</span>
        </div>
      ))}

      <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: green[50], borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: gray[700] }}>Total</span>
        <span style={{ fontSize: "14px", fontWeight: 700, color: green[600] }}>Rs. 580</span>
      </div>
      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
        <ShieldCheck size={12} color={green[600]} />
        <span style={{ fontSize: "11px", color: green[700], fontWeight: 500 }}>Verified by licensed pharmacist</span>
      </div>
    </div>

    <div style={{
      position: "absolute", top: "-12px", right: "-12px",
      backgroundColor: green[600], color: "#fff",
      padding: "5px 12px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 600,
      boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
    }}>
      Free delivery over Rs. 500
    </div>
  </div>
)

const PrescriptionVisual = () => (
  <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: `1px solid ${gray[200]}`, padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
    <div style={{ border: `2px dashed ${green[500]}`, borderRadius: "12px", padding: "24px", textAlign: "center", backgroundColor: green[50], marginBottom: "20px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
        <FileText size={22} color={green[600]} />
      </div>
      <p style={{ fontSize: "13px", fontWeight: 600, color: gray[700], margin: "0 0 4px" }}>Upload Your Prescription</p>
      <p style={{ fontSize: "11px", color: gray[500], margin: 0 }}>JPG, PNG or PDF · Max 10 MB</p>
    </div>

    <p style={{ fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
      Review Status
    </p>
    {[
      { label: "Prescription uploaded",   done: true  },
      { label: "Under pharmacist review", done: true  },
      { label: "Approved & dispatched",   done: false },
    ].map(({ label, done }, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < 2 ? "10px" : 0 }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: done ? green[600] : gray[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 size={12} color={done ? "#fff" : gray[500]} />
        </div>
        <span style={{ fontSize: "12px", color: done ? gray[700] : gray[500], fontWeight: done ? 500 : 400 }}>
          {label}
        </span>
      </div>
    ))}
  </div>
)

const DeliveryVisual = () => {
  const steps = [
    { label: "Order Confirmed",  time: "9:00 AM",  done: true,  icon: <CheckCircle2 size={12} color="#fff" />     },
    { label: "Dispatched",       time: "10:30 AM", done: true,  icon: <Package size={12} color="#fff" />          },
    { label: "Out for Delivery", time: "1:15 PM",  done: true,  icon: <Truck size={12} color="#fff" />            },
    { label: "Delivered",        time: "~2:00 PM", done: false, icon: <CheckCircle2 size={12} color={gray[500]} />},
  ]

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: `1px solid ${gray[200]}`, padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Truck size={18} color={green[600]} />
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0 }}>Order #EP-2025-08432</p>
          <p style={{ fontSize: "11px", color: green[600], margin: 0, fontWeight: 500 }}>Out for delivery</p>
        </div>
      </div>

      {steps.map(({ label, time, done, icon }, i) => (
        <div key={i} style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: done ? green[600] : gray[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: "2px", height: "22px", backgroundColor: done && i < steps.length - 2 ? green[200] : gray[100], margin: "2px 0" }} />
            )}
          </div>
          <div style={{ paddingTop: "3px", paddingBottom: i < steps.length - 1 ? "4px" : 0 }}>
            <p style={{ fontSize: "12px", fontWeight: done ? 600 : 400, color: done ? gray[900] : gray[500], margin: "0 0 2px" }}>{label}</p>
            <p style={{ fontSize: "10px", color: gray[500], margin: 0 }}>{time}</p>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "14px", padding: "10px 14px", backgroundColor: green[50], borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: green[700], fontWeight: 500, margin: 0, textAlign: "center" }}>
          🚴 Your rider is 10 minutes away!
        </p>
      </div>
    </div>
  )
}

// ── Slide data ─────────────────────────────────────────────────────────────────

interface SlideData {
  badgeIcon: React.ReactNode
  badge: string
  headline: React.ReactNode
  subtext: string
  /** `to` is used for signed-out visitors; `authTo` for already-authenticated users (skip registration). */
  ctaPrimary: { label: string; to: string; authTo: string }
  /** Either a same-page hash anchor (`href`), or an app route (`to`/`authTo`, same convention as ctaPrimary). */
  ctaSecondary: { label: string; href: string } | { label: string; to: string; authTo: string }
  visual: React.ReactNode
  gradient: string
}

const SLIDES: SlideData[] = [
  {
    badgeIcon: <ShieldCheck size={13} color={green[700]} />,
    badge: "Licensed & Verified Pharmacy",
    headline: <>Your Health, <span style={{ color: green[600] }}>Delivered</span> to Your Door</>,
    subtext: "Nepal's most trusted online pharmacy. Genuine medicines, vitamins and healthcare products delivered to your door.",
    ctaPrimary:   { label: "Get Started Free",    to: "/register", authTo: "/shop" },
    ctaSecondary: { label: "How it works",         href: "#how"    },
    visual: <OrderVisual />,
    gradient: `linear-gradient(135deg, ${green[50]} 0%, #ffffff 60%)`,
  },
  {
    badgeIcon: <FileText size={13} color={green[700]} />,
    badge: "Hassle-Free Prescription Service",
    headline: <>Upload Prescription, <span style={{ color: green[600] }}>We Handle</span> the Rest</>,
    subtext: "Simply upload your doctor's prescription. Our licensed pharmacists review and dispatch your medicines safely.",
    ctaPrimary:   { label: "Upload Prescription", to: "/register", authTo: "/account/prescriptions" },
    ctaSecondary: { label: "Learn more",           href: "#how"    },
    visual: <PrescriptionVisual />,
    gradient: `linear-gradient(135deg, #f0fdf4 0%, ${green[50]} 60%)`,
  },
  {
    badgeIcon: <Truck size={13} color={green[700]} />,
    badge: "Free Delivery on Orders Over Rs. 500",
    headline: <>Fast Delivery <span style={{ color: green[600] }}>Across Nepal</span></>,
    subtext: "Same-day delivery in Kathmandu valley. Next-day delivery across Nepal. Track your order every step of the way.",
    ctaPrimary:   { label: "Order Now",        to: "/register", authTo: "/shop" },
    ctaSecondary: { label: "Track an order",   to: "/login",    authTo: "/account/orders" },
    visual: <DeliveryVisual />,
    gradient: `linear-gradient(135deg, ${green[50]} 0%, #f0fdf4 60%)`,
  },
]

// ── Responsive styles (breakpoints match Navbar/CheckoutPage: 768px) ───────────
const HERO_STYLES = `
  .hero-slide    { padding: 96px 24px; }
  .hero-grid     { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  .hero-headline { font-size: 46px; }
  .hero-cta-row  { display: flex; gap: 12px; flex-wrap: wrap; }
  .hero-nav-btn  { width: 40px; height: 40px; }

  @media (max-width: 900px) {
    .hero-grid   { grid-template-columns: 1fr; gap: 28px; }
    .hero-visual { display: none; }
  }
  @media (max-width: 768px) {
    .hero-slide    { padding: 56px 20px 72px; }
    .hero-headline { font-size: 32px; }
    .hero-nav-btn  { width: 32px; height: 32px; }
  }
  @media (max-width: 420px) {
    .hero-headline { font-size: 26px; }
    .hero-cta-row > * { flex: 1 1 auto; justify-content: center; }
  }
`

// ── Carousel ───────────────────────────────────────────────────────────────────

export const HeroCarousel = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)

  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), [])
  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    // Restart the countdown on every slide change so a manual prev/next/dot
    // click doesn't get immediately overridden by an autoplay tick that was
    // already mid-flight — otherwise the buttons feel like they double-skip.
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, current])

  return (
    <div
      id="hero"
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{HERO_STYLES}</style>

      {/* ── Sliding track ── */}
      <div style={{
        display: "flex",
        width: `${SLIDES.length * 100}%`,
        transform: `translateX(-${current * (100 / SLIDES.length)}%)`,
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {SLIDES.map((slide, i) => {
          const isActive = i === current
          const secondaryStyle = { display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 26px", backgroundColor: "#fff", color: gray[700], borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", border: `1px solid ${gray[200]}` }
          return (
          <div key={i} style={{ width: `${100 / SLIDES.length}%`, flex: "0 0 auto" }} aria-hidden={!isActive}>
            <section className="hero-slide" style={{ background: slide.gradient }}>
              <div className="hero-grid" style={{ maxWidth: "1200px", margin: "0 auto" }}>

                {/* Left content */}
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", backgroundColor: green[100], padding: "5px 13px", borderRadius: "20px", marginBottom: "22px" }}>
                    {slide.badgeIcon}
                    <span style={{ fontSize: "12px", fontWeight: 600, color: green[700] }}>{slide.badge}</span>
                  </div>

                  {/* Only the active slide's headline is a real <h1> — the page should
                      only ever have one, and inactive slides shouldn't be announced. */}
                  {isActive ? (
                    <h1 className="hero-headline" style={{ fontWeight: 800, color: gray[900], lineHeight: 1.15, margin: "0 0 18px" }}>
                      {slide.headline}
                    </h1>
                  ) : (
                    <div className="hero-headline" style={{ fontWeight: 800, color: gray[900], lineHeight: 1.15, margin: "0 0 18px" }}>
                      {slide.headline}
                    </div>
                  )}

                  <p style={{ fontSize: "16px", color: gray[500], lineHeight: 1.7, margin: "0 0 32px", maxWidth: "460px" }}>
                    {slide.subtext}
                  </p>

                  <div className="hero-cta-row">
                    <Link
                      to={isAuthenticated ? slide.ctaPrimary.authTo : slide.ctaPrimary.to}
                      tabIndex={isActive ? undefined : -1}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 26px", backgroundColor: green[600], color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
                    >
                      {slide.ctaPrimary.label}
                    </Link>
                    {"href" in slide.ctaSecondary ? (
                      <a
                        href={slide.ctaSecondary.href}
                        tabIndex={isActive ? undefined : -1}
                        style={secondaryStyle}
                      >
                        {slide.ctaSecondary.label}
                      </a>
                    ) : (
                      <Link
                        to={isAuthenticated ? slide.ctaSecondary.authTo : slide.ctaSecondary.to}
                        tabIndex={isActive ? undefined : -1}
                        style={secondaryStyle}
                      >
                        {slide.ctaSecondary.label}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right visual — hidden on narrow screens to keep the hero short */}
                <div className="hero-visual" style={{ position: "relative" }}>
                  {slide.visual}
                </div>

              </div>
            </section>
          </div>
          )
        })}
      </div>

      {/* ── Prev button ── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="hero-nav-btn"
        style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", borderRadius: "50%", backgroundColor: "#fff", border: `1px solid ${gray[200]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
      >
        <ChevronLeft size={18} color={gray[700]} />
      </button>

      {/* ── Next button ── */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="hero-nav-btn"
        style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", borderRadius: "50%", backgroundColor: "#fff", border: `1px solid ${gray[200]}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
      >
        <ChevronRight size={18} color={gray[700]} />
      </button>

      {/* ── Dot indicators ── */}
      <div style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: current === i ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              backgroundColor: current === i ? green[600] : gray[200],
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  )
}
