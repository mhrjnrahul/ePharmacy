import { Link } from "react-router-dom"
import { Pill, Phone, Mail, MapPin } from "lucide-react"
import { green, gray } from "./tokens"

const QUICK_LINKS    = ["Home", "About Us", "Contact", "Blog"]
const CATEGORY_LINKS = ["Antibiotics", "Analgesics", "Antacids", "Antihistamines", "Antidiabetics"]
const LEGAL_LINKS    = ["Privacy Policy", "Terms of Service", "Return Policy", "FAQ"]

const FooterCol = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#fff", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {title}
    </h4>
    {links.map(l => (
      <a
        key={l}
        href="#"
        style={{ display: "block", fontSize: "13px", color: gray[500], textDecoration: "none", marginBottom: "10px", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = green[500])}
        onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
      >
        {l}
      </a>
    ))}
  </div>
)

export const Footer = () => (
  <footer style={{ backgroundColor: gray[900], color: "#fff", padding: "64px 24px 32px" }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>

        {/* Brand column */}
        <div>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={18} color="#fff" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>ePharmacy</span>
          </Link>
          <p style={{ fontSize: "13px", color: gray[500], lineHeight: 1.7, margin: "0 0 20px", maxWidth: "280px" }}>
            Nepal's trusted online pharmacy. Genuine medicines, licensed pharmacists, delivered to your door.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { icon: <Phone  size={13} />, text: "+977-01-XXXXXXX"           },
              { icon: <Mail   size={13} />, text: "support@epharmacy.com.np"  },
              { icon: <MapPin size={13} />, text: "Kathmandu, Nepal"           },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: gray[500] }}>
                {icon} {text}
              </div>
            ))}
          </div>
        </div>

        <FooterCol title="Quick Links" links={QUICK_LINKS}    />
        <FooterCol title="Categories"  links={CATEGORY_LINKS} />
        <FooterCol title="Legal"       links={LEGAL_LINKS}    />

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1f2937", paddingTop: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
