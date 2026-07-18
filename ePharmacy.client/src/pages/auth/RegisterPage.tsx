import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { registerUser } from "@/api/auth"
import { extractErrorMessage } from "@/lib/errors"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { PageMeta } from "@/components/PageMeta"

const RegisterPage = () => {
  const navigate = useNavigate()

  const [firstName,        setFirstName       ] = useState("")
  const [lastName,         setLastName        ] = useState("")
  const [email,            setEmail           ] = useState("")
  const [password,         setPassword        ] = useState("")
  const [confirmPassword,  setConfirmPassword ] = useState("")
  const [showPassword,     setShowPassword    ] = useState(false)
  const [error,            setError           ] = useState("")
  const [success,          setSuccess         ] = useState(false)

  const { mutate: register, isPending } = useMutation({
    mutationFn: registerUser,
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(extractErrorMessage(err, "Registration failed. Please try again.")),
  })

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigate("/login"), 3000)
    return () => clearTimeout(t)
  }, [success, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!firstName.trim())            { setError("First name is required.");                  return }
    if (!email.trim())                { setError("Email is required.");                        return }
    if (!password)                    { setError("Password is required.");                     return }
    if (password.length < 8)          { setError("Password must be at least 8 characters.");  return }
    if (password !== confirmPassword) { setError("Passwords do not match.");                   return }
    register({ email: email.trim(), first_name: firstName.trim(), last_name: lastName.trim(), password })
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <PageMeta title="Create Account" />
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 size={32} color="#059669" />
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
          Account created!
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>
          Your account has been created successfully.
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
          Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div>
      <PageMeta title="Create Account" />
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 6px 0" }}>
          Create your account
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Start ordering medicines in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
              First Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Rahul"
              disabled={isPending}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Last Name</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Maharjan"
              disabled={isPending}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            Email <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isPending}
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            Password <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              disabled={isPending}
              style={{ ...inputStyle, paddingRight: "40px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 0 }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: password.length >= 12 ? "#059669" : password.length >= 8 ? (i <= 2 ? "#ca8a04" : "#e5e7eb") : (i === 1 ? "#ef4444" : "#e5e7eb") }} />
              ))}
              <span style={{ fontSize: "11px", color: password.length >= 12 ? "#059669" : password.length >= 8 ? "#ca8a04" : "#ef4444", whiteSpace: "nowrap" }}>
                {password.length >= 12 ? "Strong" : password.length >= 8 ? "Good" : "Weak"}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            Confirm Password <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            disabled={isPending}
            style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "#ef4444" : "#e5e7eb" }}
          />
          {confirmPassword && confirmPassword !== password && (
            <p style={{ fontSize: "11px", color: "#ef4444", margin: 0 }}>Passwords do not match</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <p style={{ fontSize: "13px", color: "#991b1b", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#059669", fontSize: "13px", fontWeight: 600, color: "#ffffff", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1, marginTop: "4px" }}
        >
          {isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          {isPending ? "Creating account..." : "Create Account"}
        </button>

      </form>
    </div>
  )
}

export default RegisterPage