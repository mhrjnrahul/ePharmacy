import { useState, useMemo } from "react";
import { Users, Search, X, UserX, RotateCcw, Loader2, FileText } from "lucide-react";
import { useAllUsers, useDeleteUser, useRestoreUser } from "../../hooks/useUsers";
import { useAllPrescriptions } from "../../hooks/usePrescriptions";
import { PrescriptionStatusTag } from "../../components/ui/tag";
import { gray, green, red } from "../../lib/adminTokens";
import type { UserRead } from "../../types/auth";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Confirm modal (deactivate / restore) ─────────────────────────────────────
interface ConfirmModalProps {
  user: UserRead
  action: "delete" | "restore"
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
  error: string
}

const ConfirmModal = ({ user, action, onConfirm, onClose, isPending, error }: ConfirmModalProps) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>
          {action === "delete" ? "Deactivate Customer" : "Restore Customer"}
        </h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>
      <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
        {action === "delete"
          ? <><strong style={{ color: gray[900] }}>{user.first_name} {user.last_name}</strong> will no longer be able to log in or place orders.</>
          : <><strong style={{ color: gray[900] }}>{user.first_name} {user.last_name}</strong> will regain access to their account.</>}
      </p>
      {error && (
        <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}`, marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
        </div>
      )}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={onConfirm} disabled={isPending}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: action === "delete" ? red[600] : green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          {action === "delete" ? "Deactivate" : "Restore"}
        </button>
      </div>
    </div>
  </div>
)

// ── Customer detail drawer ────────────────────────────────────────────────────
const CustomerDrawer = ({ user, onClose }: { user: UserRead; onClose: () => void }) => {
  // Prescriptions expose the customer's UUID on the list serializer, so this
  // can be filtered client-side. Orders currently can't be — the admin orders
  // list endpoint doesn't return a customer identity per row (see findings),
  // so order history isn't shown here until that's added on the backend.
  const { data: allPrescriptions = [], isLoading } = useAllPrescriptions()
  const prescriptions = useMemo(
    () => allPrescriptions.filter(p => p.customer === user.id),
    [allPrescriptions, user.id],
  )

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 100vw)", backgroundColor: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${gray[200]}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Customer</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ backgroundColor: gray[50], borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>
              {user.first_name} {user.last_name}
            </p>
            <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>{user.email}</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: user.is_active ? green[50] : red[50], color: user.is_active ? green[700] : red[700] }}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
              {(user as any).date_joined && (
                <span style={{ fontSize: "12px", color: gray[400], alignSelf: "center" }}>
                  Joined {formatDate((user as any).date_joined)}
                </span>
              )}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: gray[700], margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={14} /> Prescriptions
            </p>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: gray[400], fontSize: "13px" }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
              </div>
            ) : prescriptions.length === 0 ? (
              <p style={{ fontSize: "13px", color: gray[400], margin: 0 }}>No prescriptions submitted.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {prescriptions.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", backgroundColor: gray[50], borderRadius: "8px", border: `1px solid ${gray[200]}` }}>
                    <span style={{ fontSize: "12px", color: gray[500] }}>{formatDate(p.created_at)}</span>
                    <PrescriptionStatusTag status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "10px 12px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "1px solid #fef3c7" }}>
            <p style={{ fontSize: "12px", color: "#b45309", margin: 0, lineHeight: 1.5 }}>
              Order history isn't shown here yet — the orders list doesn't currently expose which
              customer each order belongs to, so it can't be filtered per-customer without a backend change.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CustomersPage() {
  const { data: allUsers = [], isLoading, isError } = useAllUsers();
  const deleteUser = useDeleteUser()
  const restoreUser = useRestoreUser()

  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<UserRead | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ user: UserRead; action: "delete" | "restore" } | null>(null)
  const [actionError, setActionError] = useState("")

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

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setActionError("")
    try {
      if (confirmTarget.action === "delete") await deleteUser.mutateAsync(confirmTarget.user.id)
      else await restoreUser.mutateAsync(confirmTarget.user.id)
      setConfirmTarget(null)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? "Something went wrong. Try again.")
    }
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
        .customers-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr; }
        @media (max-width: 640px) { .customers-row { grid-template-columns: 1.5fr 1fr 1fr; } .customers-row .customers-col-email, .customers-row .customers-col-joined { display: none; } }
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
          {["Name", "Email", "Joined", "Status", "Actions"].map((h) => (
            <span
              key={h}
              className={h === "Email" ? "customers-col-email" : h === "Joined" ? "customers-col-joined" : undefined}
              style={{ fontSize: 11, fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Actions" ? "right" : "left" }}
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
              cursor: "pointer",
            }}
            onClick={() => setSelectedUser(user)}
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
                width: "fit-content",
              }}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {user.is_active ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmTarget({ user, action: "delete" }); setActionError("") }}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${red[100]}`, backgroundColor: red[50], fontSize: "12px", color: red[700], cursor: "pointer", fontWeight: 500 }}
                >
                  <UserX size={13} /> Deactivate
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmTarget({ user, action: "restore" }); setActionError("") }}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${green[100]}`, backgroundColor: green[50], fontSize: "12px", color: green[700], cursor: "pointer", fontWeight: 500 }}
                >
                  <RotateCcw size={13} /> Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedUser && <CustomerDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {confirmTarget && (
        <ConfirmModal
          user={confirmTarget.user}
          action={confirmTarget.action}
          onConfirm={handleConfirm}
          onClose={() => setConfirmTarget(null)}
          isPending={deleteUser.isPending || restoreUser.isPending}
          error={actionError}
        />
      )}
    </div>
  );
}
