import { Link } from "react-router-dom"
import {
  Pill, ShieldCheck, Truck, Clock, Search,
  ShoppingCart, Package, ChevronRight, Phone,
  Mail, MapPin, Star
} from "lucide-react"

// ── design tokens ─────────────────────────────────────────────────────────────
const green  = { 50: "#ecfdf5", 100: "#d1fae5", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46" }
const gray   = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 500: "#6b7280", 700: "#374151", 900: "#111827" }

// ── reusable ──────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav style={{ position: "sticky", top: 0, zIndex: 40, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${gray[200]}` }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pill size={18} color="#ffffff" />
        </div>
        <span style={{ fontSize: "18px", fontWeight: 700, color: gray[900] }}>ePharmacy</span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {[
          { label: "Home",       href: "#hero"        },
          { label: "Features",   href: "#features"    },
          { label: "How it works", href: "#how"       },
          { label: "Categories", href: "#categories"  },
        ].map(({ label, href }) => (
          <a key={label} href={href} style={{ fontSize: "14px", color: gray[500], textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = green[600])}
            onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/login" style={{ padding: "7px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#ffffff", fontSize: "13px", fontWeight: 500, color: gray[700], textDecoration: "none" }}>
          Sign In
        </Link>
        <Link to="/register" style={{ padding: "7px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 500, color: "#ffffff", textDecoration: "none" }}>
          Get Started
        </Link>
      </div>
    </div>
  </nav>
)

const Footer = () => (
  <footer style={{ backgroundColor: gray[900], color: "#ffffff", padding: "64px 24px 32px" }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>

        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700 }}>ePharmacy</span>
          </div>
          <p style={{ fontSize: "13px", color: gray[500], lineHeight: 1.7, margin: "0 0 20px 0", maxWidth: "280px" }}>
            Nepal's trusted online pharmacy. Genuine medicines, licensed pharmacists, delivered to your door.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { icon: <Phone size={13} />, text: "+977-01-XXXXXXX" },
              { icon: <Mail size={13} />,  text: "support@epharmacy.com.np" },
              { icon: <MapPin size={13} />,text: "Kathmandu, Nepal" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: gray[500] }}>
                {icon} {text}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Links</h4>
          {["Home", "About Us", "Contact", "Blog"].map(l => (
            <a key={l} href="#" style={{ display: "block", fontSize: "13px", color: gray[500], textDecoration: "none", marginBottom: "10px" }}
              onMouseEnter={e => (e.currentTarget.style.color = green[500])}
              onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
            >{l}</a>
          ))}
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categories</h4>
          {["Antibiotics", "Analgesics", "Antacids", "Antihistamines", "Antidiabetics"].map(l => (
            <a key={l} href="#" style={{ display: "block", fontSize: "13px", color: gray[500], textDecoration: "none", marginBottom: "10px" }}
              onMouseEnter={e => (e.currentTarget.style.color = green[500])}
              onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
            >{l}</a>
          ))}
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal</h4>
          {["Privacy Policy", "Terms of Service", "Return Policy", "FAQ"].map(l => (
            <a key={l} href="#" style={{ display: "block", fontSize: "13px", color: gray[500], textDecoration: "none", marginBottom: "10px" }}
              onMouseEnter={e => (e.currentTarget.style.color = green[500])}
              onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
            >{l}</a>
          ))}
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: `1px solid #1f2937`, paddingTop: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>
          © 2025 ePharmacy Nepal. All rights reserved.
        </p>
        <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>
          Licensed Pharmacy · Reg. No. XXXXXXX
        </p>
      </div>
    </div>
  </footer>
)

// ── main ──────────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const categories = [
    { label: "Antibiotics",    icon: "🦠", desc: "Bacterial infection treatments",  count: 48  },
    { label: "Analgesics",     icon: "💊", desc: "Pain relief medicines",           count: 62  },
    { label: "Antacids",       icon: "🫁", desc: "Acid reflux & ulcer relief",      count: 35  },
    { label: "Antihistamines", icon: "🌿", desc: "Allergy relief medicines",        count: 29  },
    { label: "Antidiabetics",  icon: "🩸", desc: "Diabetes management",            count: 41  },
    { label: "Vitamins",       icon: "⚡", desc: "Supplements & vitamins",          count: 87  },
  ]

  const features = [
    { icon: <ShieldCheck size={22} color={green[600]} />, title: "100% Genuine Medicines",   desc: "All medicines sourced directly from verified suppliers and manufacturers."         },
    { icon: <Truck size={22} color={green[600]} />,       title: "Fast Delivery",             desc: "Same-day delivery in Kathmandu valley. Next-day delivery across Nepal."          },
    { icon: <Clock size={22} color={green[600]} />,       title: "24/7 Availability",         desc: "Order anytime. Our platform is always open, even on public holidays."           },
    { icon: <Star size={22} color={green[600]} />,        title: "Licensed Pharmacists",      desc: "Every order reviewed by a licensed pharmacist before dispatch."                 },
  ]

  const steps = [
    { icon: <Search size={24} color={green[600]} />,      step: "01", title: "Search Medicine",        desc: "Search by name, category, or condition. Find exactly what you need."          },
    { icon: <ShoppingCart size={24} color={green[600]} />,step: "02", title: "Add to Cart",            desc: "Add items to your cart. Upload prescription if required."                      },
    { icon: <Package size={24} color={green[600]} />,     step: "03", title: "Fast Delivery",          desc: "We verify your order and deliver it straight to your door."                    },
  ]

  const stats = [
    { value: "10,000+", label: "Medicines in Stock"  },
    { value: "50,000+", label: "Happy Customers"     },
    { value: "500+",    label: "Verified Suppliers"  },
    { value: "24/7",    label: "Customer Support"    },
  ]

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#ffffff" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section id="hero" style={{ background: `linear-gradient(135deg, ${green[50]} 0%, #ffffff 60%)`, padding: "100px 24px 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: green[100], padding: "6px 14px", borderRadius: "20px", marginBottom: "24px" }}>
              <ShieldCheck size={14} color={green[700]} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: green[700] }}>Licensed & Verified Pharmacy</span>
            </div>
            <h1 style={{ fontSize: "48px", fontWeight: 800, color: gray[900], lineHeight: 1.15, margin: "0 0 20px 0" }}>
              Your Health,{" "}
              <span style={{ color: green[600] }}>Delivered</span>{" "}
              to Your Door
            </h1>
            <p style={{ fontSize: "16px", color: gray[500], lineHeight: 1.7, margin: "0 0 36px 0", maxWidth: "480px" }}>
              Nepal's most trusted online pharmacy. Order genuine medicines, vitamins, and healthcare products from the comfort of your home.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                to="/register"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", backgroundColor: green[600], color: "#ffffff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
              >
                Get Started Free <ChevronRight size={16} />
              </Link>
              <a
                href="#how"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", backgroundColor: "#ffffff", color: gray[700], borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", border: `1px solid ${gray[200]}` }}
              >
                How it works
              </a>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", gap: "32px", marginTop: "48px" }}>
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: green[600], margin: "0 0 2px 0" }}>{value}</p>
                  <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual card */}
          <div style={{ position: "relative" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: `1px solid ${gray[200]}`, padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pill size={22} color={green[600]} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: 0 }}>Your Medicine Order</p>
                  <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>Estimated delivery: 2-4 hours</p>
                </div>
              </div>
              {[
                { name: "Paracetamol 500mg",  qty: "×2 strips", price: "Rs. 90"  },
                { name: "Amoxicillin 250mg",  qty: "×1 strip",  price: "Rs. 140" },
                { name: "Vitamin C 1000mg",   qty: "×1 bottle", price: "Rs. 350" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${gray[100]}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pill size={14} color={green[600]} />
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: 0 }}>{item.name}</p>
                      <p style={{ fontSize: "11px", color: gray[500], margin: 0 }}>{item.qty}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: green[600] }}>{item.price}</span>
                </div>
              ))}
              <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: green[50], borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: gray[700] }}>Total</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: green[600] }}>Rs. 580</span>
              </div>
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                <ShieldCheck size={14} color={green[600]} />
                <span style={{ fontSize: "12px", color: green[700], fontWeight: 500 }}>Verified by licensed pharmacist</span>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{ position: "absolute", top: "-16px", right: "-16px", backgroundColor: green[600], color: "#ffffff", padding: "8px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, boxShadow: "0 4px 12px rgba(5,150,105,0.4)" }}>
              Free delivery over Rs. 500
            </div>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "80px 24px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 12px 0" }}>
              Why Choose ePharmacy?
            </h2>
            <p style={{ fontSize: "16px", color: gray[500], margin: 0, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
              We combine technology with healthcare expertise to give you the best pharmacy experience in Nepal.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{ padding: "28px 24px", borderRadius: "16px", border: `1px solid ${gray[200]}`, backgroundColor: "#ffffff", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 8px 0" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: gray[500], margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: "80px 24px", backgroundColor: gray[50] }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 12px 0" }}>
              How It Works
            </h2>
            <p style={{ fontSize: "16px", color: gray[500], margin: 0 }}>
              Get your medicines in 3 simple steps
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: "40px", left: "calc(16.66% + 40px)", right: "calc(16.66% + 40px)", height: "2px", backgroundColor: green[100], zIndex: 0 }} />
            {steps.map(({ icon, step, title, desc }) => (
              <div key={step} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#ffffff", border: `2px solid ${green[100]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                  {icon}
                  <span style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: green[600], color: "#ffffff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: "0 0 8px 0" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: gray[500], margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" style={{ padding: "80px 24px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
            <div>
              <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 8px 0" }}>
                Browse by Category
              </h2>
              <p style={{ fontSize: "15px", color: gray[500], margin: 0 }}>
                Find medicines organized by drug class
              </p>
            </div>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: green[600], textDecoration: "none" }}>
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {categories.map(({ label, icon, desc, count }) => (
              <Link
                key={label}
                to="/register"
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "14px", border: `1px solid ${gray[200]}`, backgroundColor: "#ffffff", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = green[500]
                  e.currentTarget.style.backgroundColor = green[50]
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = gray[200]
                  e.currentTarget.style.backgroundColor = "#ffffff"
                }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: "0 0 3px 0" }}>{label}</p>
                  <p style={{ fontSize: "12px", color: gray[500], margin: "0 0 6px 0" }}>{desc}</p>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: green[700], backgroundColor: green[100], padding: "2px 8px", borderRadius: "20px" }}>
                    {count} medicines
                  </span>
                </div>
                <ChevronRight size={16} color={gray[500]} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: "80px 24px", background: `linear-gradient(135deg, ${green[700]} 0%, ${green[500]} 100%)` }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 700, color: "#ffffff", margin: "0 0 16px 0" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: "16px", color: green[100], margin: "0 0 36px 0", lineHeight: 1.7 }}>
            Join thousands of customers who trust ePharmacy for their healthcare needs. Register today and get your medicines delivered fast.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/register"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", backgroundColor: "#ffffff", color: green[700], borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
            >
              Create Free Account <ChevronRight size={16} />
            </Link>
            <Link
              to="/login"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", backgroundColor: "transparent", color: "#ffffff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage