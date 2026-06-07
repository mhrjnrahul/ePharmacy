import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Pill, Menu, X, ChevronDown, LayoutDashboard, ShoppingBag, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { CartTrigger, CartDrawer } from "./CartDrawer"
import { green, gray } from "./tokens"

const NAV_LINKS = [
  { label: "Home",          href: "#hero"       },
  { label: "Medicines",     href: "#medicines"  },
  { label: "How It Works",  href: "#how"        },
  { label: "Categories",    href: "#categories" },
]

const getInitials = (first: string, last: string) => {
  const a = (first ?? "").charAt(0).toUpperCase()
  const b = (last  ?? "").charAt(0).toUpperCase()
  return (a + b) || "U"
}

// ── Styles injected once ───────────────────────────────────────────────────────
const STYLES = `
  .nav-links        { display: flex; align-items: center; gap: 28px; }
  .nav-auth-desktop { display: flex; align-items: center; gap: 10px; }
  .nav-hamburger    { display: none; background: none; border: none;
                      cursor: pointer; padding: 6px; border-radius: 8px; }
  .nav-hamburger:hover { background-color: ${gray[100]}; }

  .mobile-menu      { display: none; flex-direction: column;
                      border-top: 1px solid ${gray[100]}; background: #fff;
                      box-shadow: 0 8px 16px rgba(0,0,0,0.06); }

  @media (max-width: 768px) {
    .nav-links        { display: none; }
    .nav-auth-desktop { display: none; }
    .nav-hamburger    { display: flex; align-items: center; justify-content: center; }
    .mobile-menu.open { display: flex; }
  }
`

// ── Component ──────────────────────────────────────────────────────────────────
export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close mobile menu when viewport becomes desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate("/")
  }

  const isCustomer     = user?.role === "CUSTOMER"
  const dashboardPath  = isCustomer ? "/orders" : "/dashboard"
  const dashboardLabel = isCustomer ? "My Orders" : "Dashboard"
  const initials       = getInitials(user?.first_name ?? "", user?.last_name ?? "")
  const fullName       = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()

  return (
    <>
      <style>{STYLES}</style>
      {isAuthenticated && isCustomer && <CartDrawer />}

      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${gray[200]}`,
      }}>

        {/* ── Main bar ── */}
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 20px",
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={18} color="#fff" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: gray[900] }}>ePharmacy</span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: "14px", color: gray[500], textDecoration: "none", fontWeight: 500, transition: "color 0.15s", whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.color = green[600])}
                onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right section */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>

            {/* Cart trigger — CUSTOMER only */}
            {isAuthenticated && isCustomer && <CartTrigger />}

            {/* Unauthenticated — desktop buttons */}
            {!isAuthenticated && (
              <div className="nav-auth-desktop">
                <Link
                  to="/login"
                  style={{ padding: "7px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], textDecoration: "none", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = green[600]; e.currentTarget.style.color = green[600] }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = gray[200];  e.currentTarget.style.color = gray[700]  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{ padding: "7px 16px", borderRadius: "8px", backgroundColor: green[600], fontSize: "13px", fontWeight: 500, color: "#fff", textDecoration: "none", border: "none", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[700])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = green[600])}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Authenticated — avatar + dropdown (all screen sizes) */}
            {isAuthenticated && user && (
              <div ref={dropdownRef} style={{ position: "relative" }}>

                {/* Avatar button */}
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: "2px", borderRadius: "40px" }}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: green[600], color: "#fff",
                    fontSize: "13px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, userSelect: "none",
                    boxShadow: "0 0 0 2px #fff, 0 0 0 3px " + green[500],
                    transition: "box-shadow 0.15s",
                  }}>
                    {initials}
                  </div>
                  <ChevronDown
                    size={14}
                    color={gray[500]}
                    style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    minWidth: "220px", backgroundColor: "#fff",
                    borderRadius: "14px", border: `1px solid ${gray[200]}`,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                    overflow: "hidden", zIndex: 100,
                  }}>
                    {/* User info header */}
                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${gray[100]}`, display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: green[100], color: green[700], fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fullName || "User"}
                        </p>
                        <p style={{ fontSize: "11px", color: gray[500], margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: "6px 0" }}>
                      <DropdownItem
                        icon={isCustomer ? <ShoppingBag size={15} color={gray[500]} /> : <LayoutDashboard size={15} color={gray[500]} />}
                        label={dashboardLabel}
                        to={dashboardPath}
                        onClick={() => setDropdownOpen(false)}
                      />
                    </div>

                    <div style={{ borderTop: `1px solid ${gray[100]}`, padding: "6px 0" }}>
                      <button
                        onClick={handleLogout}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px", fontSize: "13px", fontWeight: 500, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <LogOut size={15} color="#dc2626" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger (mobile only, CSS controls visibility) */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen
                ? <X    size={20} color={gray[700]} />
                : <Menu size={20} color={gray[700]} />
              }
            </button>

          </div>
        </div>

        {/* ── Mobile menu ── */}
        <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>

          {/* Nav links */}
          <div style={{ padding: "8px 0" }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "13px 24px", fontSize: "14px", color: gray[700], textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Unauthenticated — Sign In / Get Started */}
          {!isAuthenticated && (
            <div style={{ padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: "8px", borderTop: `1px solid ${gray[100]}` }}>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "10px", textAlign: "center", borderRadius: "8px", border: `1px solid ${gray[200]}`, fontSize: "13px", fontWeight: 500, color: gray[700], textDecoration: "none" }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "10px", textAlign: "center", borderRadius: "8px", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", textDecoration: "none" }}
              >
                Get Started
              </Link>
            </div>
          )}

        </div>

      </nav>
    </>
  )
}

// ── Small helper ───────────────────────────────────────────────────────────────
const DropdownItem = ({
  icon, label, to, onClick,
}: {
  icon: React.ReactNode
  label: string
  to: string
  onClick: () => void
}) => (
  <Link
    to={to}
    onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 500, color: gray[700], textDecoration: "none" }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
  >
    {icon}
    {label}
  </Link>
)
