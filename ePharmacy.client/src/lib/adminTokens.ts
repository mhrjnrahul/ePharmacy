// Shared inline-style design tokens for the admin console's older pages
// (Medicines, Categories, Manufacturers, Inventory, Stock Adjustments,
// Customers, User Management). These predate the Tailwind/CSS-variable
// system used by the newer pages (Orders, Shipments, Alerts, Reports,
// Dashboard, Prescriptions) — until this batch is migrated too, keep the
// hex values in one place instead of redeclaring the same object per file.
export const gray = {
  50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af",
  500: "#6b7280", 700: "#374151", 900: "#111827",
}

export const green = {
  50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857", 800: "#065f46",
}

export const red = {
  50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c",
}

export const amber = {
  50: "#fffbeb", 100: "#fef3c7", 600: "#d97706", 700: "#b45309",
}

export const blue = {
  50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8",
}

export const purple = {
  50: "#faf5ff", 100: "#ede9fe", 700: "#6d28d9",
}

export const teal = {
  50: "#f0fdfa", 100: "#ccfbf1", 700: "#0f766e",
}

export const adminInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}
