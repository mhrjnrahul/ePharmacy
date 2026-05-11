import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Pill,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  ClipboardList,
  ArrowLeftRight,
  BarChart2,
  UserCog,
  ScrollText,
  LogOut,
} from "lucide-react";
import type { User } from "@/types";

const navItems: {
  label: string;
  path: string;
  icon: any;
  roles: User["role"][];
}[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Medicines",
    path: "/medicines",
    icon: Pill,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Categories",
    path: "/categories",
    icon: Tags,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Suppliers",
    path: "/suppliers",
    icon: Truck,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Sales",
    path: "/sales",
    icon: ShoppingCart,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Purchase Orders",
    path: "/purchase-orders",
    icon: ClipboardList,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Stock Adjustments",
    path: "/stock-adjustments",
    icon: ArrowLeftRight,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart2,
    roles: ["ADMIN", "STAFF"],
  },
  {
    label: "Orders",
    path: "/orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "STAFF", "CUSTOMER"],
  },
  { label: "User Management", path: "/users", icon: UserCog, roles: ["ADMIN"] },
  { label: "System Logs", path: "/logs", icon: ScrollText, roles: ["ADMIN"] },
];
const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleNav = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 20px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            backgroundColor: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Pill size={14} color="#ffffff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
          ePharmacy
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 8px",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {visibleNav.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                  backgroundColor: isActive ? "#ecfdf5" : "transparent",
                  color: isActive ? "#065f46" : "#4b5563",
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div
        style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "0 8px" }}
      />

      {/* User + Logout */}
      <div style={{ padding: "12px 8px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: 500, color: "#065f46" }}
            >
              {user?.first_name?.[0] ?? "A"}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#111827",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.first_name} {user?.last_name}
            </p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
              {user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
