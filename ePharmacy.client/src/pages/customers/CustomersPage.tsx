import { useState, useMemo } from "react";
import { Users, Search, X } from "lucide-react";
import { useAllUsers } from "../../hooks/useUsers";

const green  = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857", 800: "#065f46" };
const gray   = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" };
const red    = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CustomersPage() {
  const { data: allUsers = [], isLoading, isError } = useAllUsers();

  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const customers = useMemo(
    () => allUsers.filter((u) => u.role === "CUSTOMER"),
    [allUsers]
  );

  const filtered = useMemo(() => {
    return customers.filter((u) => {
      const matchesSearch =
        search.trim() === "" ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const activeCount   = customers.filter((u) => u.is_active).length;
  const inactiveCount = customers.filter((u) => !u.is_active).length;

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  // ── Summary cards ──────────────────────────────────────────
  const summaryCards = [
    { label: "Total Customers", value: customers.length, bg: green[50],  border: green[100], text: green[800] },
    { label: "Active",          value: activeCount,      bg: green[50],  border: green[100], text: green[700] },
    { label: "Inactive",        value: inactiveCount,    bg: red[50],    border: red[100],   text: red[700]   },
  ];

  return (
    <div style={{ padding: "24px", fontFamily: "'Figtree Variable', sans-serif" }}>
      <style>{`
        .customers-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 640px) { .customers-summary-grid { grid-template-columns: 1fr; } }
        .customers-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr; }
        @media (max-width: 640px) { .customers-row { grid-template-columns: 1.5fr 1fr; } .customers-row .customers-col-email, .customers-row .customers-col-joined { display: none; } }
      `}</style>

      {/* Summary cards */}
      <div className="customers-summary-grid">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 13, color: gray[500], marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={20} color={gray[700]} />
          <span style={{ fontSize: 18, fontWeight: 600, color: gray[900] }}>Customers</span>
          <span style={{ fontSize: 14, color: gray[400] }}>({filtered.length})</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={14} color={gray[400]} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              border: `1px solid ${gray[200]}`,
              borderRadius: 8,
              fontSize: 14,
              color: gray[900],
              outline: "none",
              width: 220,
              maxWidth: "100%",
              boxSizing: "border-box",
              background: "#fff",
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${gray[200]}`,
            borderRadius: 8,
            fontSize: 14,
            color: gray[700],
            background: "#fff",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              border: `1px solid ${gray[200]}`,
              borderRadius: 8,
              fontSize: 13,
              color: gray[500],
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: `1px solid ${gray[200]}`,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          className="customers-row"
          style={{
            padding: "10px 20px",
            background: gray[50],
            borderBottom: `1px solid ${gray[200]}`,
          }}
        >
          {["Name", "Email", "Joined", "Status"].map((h) => (
            <span
              key={h}
              className={h === "Email" ? "customers-col-email" : h === "Joined" ? "customers-col-joined" : undefined}
              style={{ fontSize: 11, fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* States */}
        {isLoading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: gray[400], fontSize: 14 }}>
            Loading customers…
          </div>
        )}

        {isError && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: red[600], fontSize: 14 }}>
            Failed to load customers.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: gray[400], fontSize: 14 }}>
            {hasFilters ? "No customers match your filters." : "No customers yet."}
          </div>
        )}

        {/* Rows */}
        {!isLoading && !isError && filtered.map((user, idx) => (
          <div
            key={user.id}
            className="customers-row"
            style={{
              padding: "14px 20px",
              borderBottom: idx < filtered.length - 1 ? `1px solid ${gray[200]}` : "none",
              alignItems: "center",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = gray[50])}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            {/* Name */}
            <span style={{ fontSize: 14, fontWeight: 500, color: gray[900] }}>
              {user.first_name} {user.last_name}
            </span>

            {/* Email */}
            <span className="customers-col-email" style={{ fontSize: 14, color: gray[500] }}>{user.email}</span>

            {/* Joined */}
            <span className="customers-col-joined" style={{ fontSize: 14, color: gray[500] }}>
              {(user as any).date_joined ? formatDate((user as any).date_joined) : "—"}
            </span>

            {/* Status badge */}
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: user.is_active ? green[100] : red[100],
                color: user.is_active ? green[700] : red[700],
              }}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}