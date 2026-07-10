import { useState } from "react"
import {
  Plus, X, Loader2, Users, Shield, UserCheck,
  UserX, RotateCcw, Eye, EyeOff,
} from "lucide-react"
import { useUsers, useCreateStaff, useDeleteUser, useRestoreUser } from "@/hooks/useUsers"
import type { UserRead, AdminCreateRequest } from "@/types/auth"

// ── tokens ────────────────────────────────────────────────────────────────────
const green  = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857" }
const gray   = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red    = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }
const blue   = { 50: "#eff6ff", 100: "#dbeafe", 700: "#1d4ed8" }
const purple = { 50: "#faf5ff", 700: "#6d28d9" }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}

// ── role meta ─────────────────────────────────────────────────────────────────
const roleMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ADMIN:    { label: "Admin",    color: purple[700], bg: purple[50], icon: <Shield size={12} />    },
  STAFF:    { label: "Staff",    color: blue[700],   bg: blue[50],   icon: <UserCheck size={12} /> },
  CUSTOMER: { label: "Customer", color: gray[500],   bg: gray[100],  icon: <Users size={12} />     },
}

// ── create staff modal ────────────────────────────────────────────────────────
interface CreateStaffModalProps { onClose: () => void }

const CreateStaffModal = ({ onClose }: CreateStaffModalProps) => {
  const createStaff = useCreateStaff()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<AdminCreateRequest>({
    email: "", first_name: "", last_name: "", password: "", role: "STAFF",
  })
  const [error, setError] = useState("")

  const set = <K extends keyof AdminCreateRequest>(k: K, v: AdminCreateRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.email.trim())       { setError("Email is required.");      return }
    if (!form.first_name.trim())  { setError("First name is required."); return }
    if (!form.last_name.trim())   { setError("Last name is required.");  return }
    if (!form.password)           { setError("Password is required.");   return }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return }
    setError("")
    try {
      await createStaff.mutateAsync(form)
      onClose()
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.email)    { setError(data.email[0]);    return }
      if (data?.password) { setError(data.password[0]); return }
      setError(data?.detail ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Create Staff Account</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>First Name *</label>
              <input style={inputStyle} value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="e.g. Rahul" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Last Name *</label>
              <input style={inputStyle} value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="e.g. Maharjan" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Email *</label>
            <input type="email" style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} placeholder="staff@epharmacy.com" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: "40px" }}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: 0 }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Role *</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.role} onChange={e => set("role", e.target.value as "ADMIN" | "STAFF" | "CUSTOMER")}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}` }}>
              <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={createStaff.isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: createStaff.isPending ? "not-allowed" : "pointer", opacity: createStaff.isPending ? 0.7 : 1 }}
          >
            {createStaff.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

// ── confirm modal ─────────────────────────────────────────────────────────────
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
          {action === "delete" ? "Deactivate User" : "Restore User"}
        </h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
        {action === "delete"
          ? <><strong style={{ color: gray[900] }}>{user.first_name} {user.last_name}</strong> will no longer be able to log in.</>
          : <><strong style={{ color: gray[900] }}>{user.first_name} {user.last_name}</strong> will regain access to their account.</>
        }
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

// ── page ──────────────────────────────────────────────────────────────────────
const UserManagementPage = () => {
  const { data: users = [], isLoading, isError } = useUsers()
  const deleteUser  = useDeleteUser()
  const restoreUser = useRestoreUser()

  const [createOpen,    setCreateOpen   ] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ user: UserRead; action: "delete" | "restore" } | null>(null)
  const [actionError,   setActionError  ] = useState("")
  const [filterRole,    setFilterRole   ] = useState<"" | "ADMIN" | "STAFF" | "CUSTOMER">("")
  const [filterStatus,  setFilterStatus ] = useState<"" | "active" | "inactive">("")
  const [search,        setSearch       ] = useState("")

  const filtered = users.filter(u => {
    if (filterRole   && u.role !== filterRole)            return false
    if (filterStatus === "active"   && !u.is_active)      return false
    if (filterStatus === "inactive" && u.is_active)       return false
    if (search && !`${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setActionError("")
    try {
      // ── NOTE: delete/restore currently use UUID as ID.
      // ── Once your friend fixes the backend to accept UUID (instead of integer pk),
      // ── no changes needed here — user.id is already a UUID string.
      // ── If backend keeps integer pk, your friend needs to return the integer pk
      // ── in the user list response so we can pass it here instead of user.id.
      if (confirmTarget.action === "delete") {
        await deleteUser.mutateAsync(confirmTarget.user.id)
      } else {
        await restoreUser.mutateAsync(confirmTarget.user.id)
      }
      setConfirmTarget(null)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? "Something went wrong. Try again.")
    }
  }

  const roleCounts = {
    ADMIN:    users.filter(u => u.role === "ADMIN").length,
    STAFF:    users.filter(u => u.role === "STAFF").length,
    CUSTOMER: users.filter(u => u.role === "CUSTOMER").length,
  }

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>Loading users…</span>
    </div>
  )

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load users. Check your connection and try again.</p>
    </div>
  )

  return (
    <div>
      <style>{`
        .user-mgmt-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 640px) { .user-mgmt-summary-grid { grid-template-columns: 1fr; } }
      `}</style>
      {/* Summary cards */}
      <div className="user-mgmt-summary-grid">
        {(["ADMIN", "STAFF", "CUSTOMER"] as const).map(role => {
          const meta = roleMeta[role]
          return (
            <div key={role} style={{ backgroundColor: meta.bg, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: meta.color }}>
                {meta.icon}
              </div>
              <div>
                <p style={{ fontSize: "22px", fontWeight: 700, color: gray[900], margin: 0, lineHeight: 1 }}>{roleCounts[role]}</p>
                <p style={{ fontSize: "12px", color: gray[500], margin: "4px 0 0 0" }}>{meta.label}s</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>User Management</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {filtered.length} of {users.length} users
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          <Plus size={14} /> Create Staff
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, width: "220px", maxWidth: "100%" }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
        />
        <select style={{ ...inputStyle, width: "140px", maxWidth: "100%", cursor: "pointer" }} value={filterRole} onChange={e => setFilterRole(e.target.value as any)}>
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <select style={{ ...inputStyle, width: "140px", maxWidth: "100%", cursor: "pointer" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || filterRole || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterRole(""); setFilterStatus("") }}
            style={{ fontSize: "12px", color: gray[500], background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: gray[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users size={22} color={gray[400]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No users found</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["User", "Email", "Role", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const meta = roleMeta[user.role]
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* User */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: meta.color }}>
                            {user.first_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: gray[900] }}>
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", color: gray[500] }}>{user.email}</span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", backgroundColor: meta.bg }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: meta.color }}>{meta.label}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: user.is_active ? green[50] : red[50], color: user.is_active ? green[700] : red[700] }}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                        {user.is_active ? (
                          <button
                            onClick={() => { setConfirmTarget({ user, action: "delete" }); setActionError("") }}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${red[100]}`, backgroundColor: red[50], fontSize: "12px", color: red[700], cursor: "pointer", fontWeight: 500 }}
                          >
                            <UserX size={13} /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => { setConfirmTarget({ user, action: "restore" }); setActionError("") }}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${green[100]}`, backgroundColor: green[50], fontSize: "12px", color: green[700], cursor: "pointer", fontWeight: 500 }}
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && <CreateStaffModal onClose={() => setCreateOpen(false)} />}

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
  )
}

export default UserManagementPage