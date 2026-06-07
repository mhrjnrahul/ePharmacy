import { useState } from "react"
import { ChevronRight, AlertCircle } from "lucide-react"
import { useMedicines } from "@/hooks/useMedicines"
import { useAuthStore } from "@/store/authStore"
import { MedicineCard, MedicineCardSkeleton } from "./MedicineCard"
import { MedicineDetailModal } from "./MedicineDetailModal"
import { green, gray } from "./tokens"

const VISIBLE_COUNT = 8

export const MedicinesSection = () => {
  const { data: medicines, isLoading, isError } = useMedicines()
  const { isAuthenticated } = useAuthStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visible = medicines?.filter(m => m.is_active).slice(0, VISIBLE_COUNT) ?? []

  return (
    <>
      <section id="medicines" style={{ padding: "80px 24px", backgroundColor: gray[50] }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 8px" }}>
                Browse Our Medicines
              </h2>
              <p style={{ fontSize: "15px", color: gray[500], margin: 0 }}>
                Explore our wide range of genuine, verified medicines
              </p>
            </div>
            {!isAuthenticated && (
              <a
                href="/register"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: green[600], textDecoration: "none", flexShrink: 0, marginBottom: "6px" }}
              >
                View all <ChevronRight size={15} />
              </a>
            )}
          </div>

          {/* Error state */}
          {isError && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 24px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", marginBottom: "32px" }}>
              <AlertCircle size={18} color="#ef4444" />
              <p style={{ fontSize: "14px", color: "#b91c1c", margin: 0 }}>
                Could not load medicines. Please refresh the page.
              </p>
            </div>
          )}

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {isLoading
              ? Array.from({ length: VISIBLE_COUNT }).map((_, i) => <MedicineCardSkeleton key={i} />)
              : visible.map(medicine => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    onDetails={() => setSelectedId(medicine.id)}
                  />
                ))
            }
          </div>

          {/* Empty state */}
          {!isLoading && !isError && visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 24px", color: gray[500] }}>
              <p style={{ fontSize: "15px", margin: 0 }}>No medicines available at the moment.</p>
            </div>
          )}

        </div>
      </section>

      {/* Detail modal — rendered at section level to avoid z-index issues */}
      {selectedId && (
        <MedicineDetailModal
          medicineId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}
