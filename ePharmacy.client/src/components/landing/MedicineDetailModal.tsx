import { useState, useEffect, useRef } from "react"
import { X, Pill, ShieldAlert, Minus, Plus, ShoppingCart, LogIn, Package, Check, AlertTriangle, Upload, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMedicineDetail } from "@/hooks/useMedicines"
import { useAddToCart, useCart } from "@/hooks/useCart"
import { useUploadPrescription } from "@/hooks/usePrescriptions"
import { openCart } from "./CartDrawer"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { green, gray } from "./tokens"

const BASE_URL = "http://127.0.0.1:8000"
const ACCEPTED_RX_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_RX_SIZE_MB = 10

// Lets a customer submit a prescription right from the medicine they're viewing,
// instead of forcing a trip to the separate "My Prescriptions" page first.
const InlinePrescriptionUpload = () => {
  const upload = useUploadPrescription()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploaded, setUploaded] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_RX_TYPES.includes(file.type)) {
      toast.error("Upload a JPG, PNG, WebP image or a PDF.")
      return
    }
    if (file.size > MAX_RX_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large — keep it under ${MAX_RX_SIZE_MB} MB.`)
      return
    }
    try {
      await upload.mutateAsync(file)
      setUploaded(true)
      toast.success("Prescription submitted for review.")
    } catch (err: any) {
      toast.error(err?.response?.data?.image?.[0] ?? "Upload failed. Try again.")
    }
  }

  if (uploaded) {
    return (
      <p style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", fontWeight: 600, color: green[700] }}>
        <Check size={13} color={green[600]} /> Submitted — track its status in My Prescriptions.
      </p>
    )
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px", backgroundColor: "#fff", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#92400e", cursor: upload.isPending ? "wait" : "pointer" }}
      >
        {upload.isPending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
        {upload.isPending ? "Uploading…" : "Upload Prescription Now"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_RX_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = "" }}
      />
    </div>
  )
}

interface Props {
  medicineId: string | null
  onClose: () => void
}

export const MedicineDetailModal = ({ medicineId, onClose }: Props) => {
  const { user, isAuthenticated } = useAuthStore()
  const isCustomer = user?.role === "CUSTOMER"

  const { data: medicine, isLoading, isError } = useMedicineDetail(medicineId)
  const { data: cart } = useCart()
  const { mutate: addToCart, isPending: adding, reset } = useAddToCart()

  const cartItem = cart?.items.find(i => i.medicine === medicineId)
  const isInCart = !!cartItem

  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQty(1)
    setJustAdded(false)
    reset()
  }, [medicineId, reset])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!medicineId) return null

  const imageUrl = medicine?.image
    ? medicine.image.startsWith("http") ? medicine.image : `${BASE_URL}${medicine.image}`
    : null

  const handleAddToCart = () => {
    if (!medicine) return

    // Prescription warning fires immediately, before the API call
    if (medicine.requires_prescription) {
      toast.warning(`${medicine.name} requires a prescription — upload one above or anytime before checkout.`)
    }

    addToCart(
      { medicine: medicine.id, quantity: qty },
      {
        onSuccess: () => {
          setJustAdded(true)
          if (!medicine.requires_prescription) {
            toast.success(`${medicine.name} added to cart!`)
          }
        },
        onError: () => {
          toast.error("Failed to add to cart. Please try again.")
        },
      }
    )
  }

  const handleOpenCart = () => {
    onClose()
    openCart()
  }

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(3px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "600px",
        backgroundColor: "#fff", borderRadius: "20px",
        overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        position: "relative",
      }}>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "14px", right: "14px", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: gray[100], border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[200])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = gray[100])}
        >
          <X size={15} color={gray[700]} />
        </button>

        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "thin" }}>

          {/* Loading skeleton */}
          {isLoading && (
            <>
              <div style={{ height: "220px", backgroundColor: gray[100] }} />
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {[70, 45, 90, 55].map((w, i) => (
                  <div key={i} style={{ height: "14px", borderRadius: "6px", backgroundColor: gray[100], width: `${w}%` }} />
                ))}
              </div>
            </>
          )}

          {/* Error */}
          {isError && (
            <div style={{ padding: "64px 28px", textAlign: "center", color: gray[500] }}>
              <Package size={40} color={gray[200]} style={{ marginBottom: "12px" }} />
              <p style={{ fontSize: "14px", margin: 0 }}>Could not load medicine details.</p>
            </div>
          )}

          {medicine && (
            <>
              {/* Image */}
              <div style={{ height: "220px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={medicine.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "72px", height: "72px", borderRadius: "20px", backgroundColor: green[100], display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pill size={32} color={green[600]} />
                  </div>
                )}
              </div>

              <div style={{ padding: "24px 28px 28px" }}>

                {/* Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: green[700], backgroundColor: green[50], padding: "4px 10px", borderRadius: "20px" }}>
                    {medicine.category_name}
                  </span>
                  {medicine.requires_prescription && (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#b45309", backgroundColor: "#fef3c7", padding: "4px 9px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <ShieldAlert size={10} color="#b45309" /> Prescription Required
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: gray[900], margin: "0 0 6px", lineHeight: 1.3 }}>
                  {medicine.name}
                </h2>

                {/* Meta grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", margin: "20px 0", padding: "16px", backgroundColor: gray[50], borderRadius: "12px" }}>
                  <InfoRow label="Strength"     value={medicine.strength} />
                  <InfoRow label="Dosage Form"  value={medicine.dosage_form_display} />
                  <InfoRow label="Manufacturer" value={medicine.manufacturer_name} />
                  <InfoRow label="Status"       value={medicine.is_active ? "In Stock" : "Out of Stock"} valueColor={medicine.is_active ? green[700] : "#ef4444"} />
                </div>

                {/* Description */}
                {medicine.description && (
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: gray[700], margin: "0 0 6px" }}>About</p>
                    <p style={{ fontSize: "13px", color: gray[500], margin: 0, lineHeight: 1.7 }}>{medicine.description}</p>
                  </div>
                )}

                {/* Rx warning banner */}
                {medicine.requires_prescription && (
                  <div style={{ display: "flex", gap: "10px", padding: "12px 14px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", marginBottom: "20px" }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                        <strong>Prescription required.</strong> You must have a valid prescription for this medicine — the pharmacy confirms which items it covers after review.
                      </p>
                      {isAuthenticated && isCustomer && <InlinePrescriptionUpload />}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {!isAuthenticated ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link
                      to="/login" onClick={onClose}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", backgroundColor: green[600], color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[700])}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = green[600])}
                    >
                      <LogIn size={16} /> Sign In to Order
                    </Link>
                    <p style={{ fontSize: "12px", color: gray[500], textAlign: "center", margin: 0 }}>
                      No account?{" "}
                      <Link to="/register" onClick={onClose} style={{ color: green[600], textDecoration: "none", fontWeight: 500 }}>Create one</Link>
                    </p>
                  </div>

                ) : isCustomer ? (
                  isInCart ? (
                    /* Already in cart — show current state + open cart */
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", backgroundColor: green[50], border: `1px solid ${green[200]}`, borderRadius: "10px" }}>
                        <Check size={16} color={green[600]} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: green[700] }}>
                          In your cart &mdash; {cartItem!.quantity} {cartItem!.quantity === 1 ? "unit" : "units"} added
                        </span>
                      </div>
                      <button
                        onClick={handleOpenCart}
                        style={{ padding: "11px", backgroundColor: "#fff", color: green[600], border: `1.5px solid ${green[500]}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[50])}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
                      >
                        <ShoppingCart size={15} /> Open Cart to Adjust Quantity
                      </button>
                    </div>

                  ) : justAdded ? (
                    /* Just added */
                    <div style={{ padding: "13px", backgroundColor: green[50], border: `1px solid ${green[100]}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <Check size={16} color={green[600]} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: green[700] }}>Added to cart!</span>
                    </div>

                  ) : (
                    /* Normal add */
                    <div style={{ display: "flex", gap: "10px" }}>
                      {/* Qty stepper */}
                      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${gray[200]}`, borderRadius: "10px", overflow: "hidden" }}>
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          style={{ padding: "10px 12px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: gray[700] }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[100])}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: "32px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: gray[900] }}>{qty}</span>
                        <button
                          onClick={() => setQty(q => q + 1)}
                          style={{ padding: "10px 12px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: gray[700] }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[100])}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Add to cart */}
                      <button
                        onClick={handleAddToCart}
                        disabled={adding || !medicine.is_active}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          padding: "11px",
                          backgroundColor: medicine.is_active ? green[600] : gray[200],
                          color: medicine.is_active ? "#fff" : gray[500],
                          border: "none", borderRadius: "10px",
                          fontSize: "14px", fontWeight: 600,
                          cursor: medicine.is_active && !adding ? "pointer" : "not-allowed",
                          opacity: adding ? 0.7 : 1,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (medicine.is_active && !adding) e.currentTarget.style.backgroundColor = green[700] }}
                        onMouseLeave={e => { if (medicine.is_active) e.currentTarget.style.backgroundColor = green[600] }}
                      >
                        <ShoppingCart size={16} />
                        {adding ? "Adding…" : medicine.is_active ? "Add to Cart" : "Out of Stock"}
                      </button>
                    </div>
                  )

                ) : null /* ADMIN/STAFF — no cart action */}

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div>
    <p style={{ fontSize: "11px", color: gray[500], margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: "13px", fontWeight: 600, color: valueColor ?? gray[900], margin: 0 }}>{value}</p>
  </div>
)
