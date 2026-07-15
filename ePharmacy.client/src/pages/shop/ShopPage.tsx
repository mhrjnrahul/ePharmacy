import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react"
import { useMedicines } from "@/hooks/useMedicines"
import { useAllCategories } from "@/hooks/useCategories"
import { ShopCard, ShopCardSkeleton } from "@/components/shop/ShopCard"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { PaymentResultModal } from "@/components/payment/PaymentResultModal"
import { openCart } from "@/components/landing/CartDrawer"
import type { DosageForm } from "@/types/medicine"

interface PaymentNavState {
  paymentStatus?: "success" | "failed"
  transactionId?: string
}

const PAGE_SIZE = 10

const DOSAGE_FORMS: { value: DosageForm; label: string }[] = [
  { value: "tablet",    label: "Tablet"    },
  { value: "capsule",   label: "Capsule"   },
  { value: "syrup",     label: "Syrup"     },
  { value: "injection", label: "Injection" },
  { value: "cream",     label: "Cream"     },
  { value: "drops",     label: "Drops"     },
  { value: "inhaler",   label: "Inhaler"   },
]

const ShopPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const paymentState = location.state as PaymentNavState | null
  const [paymentResult, setPaymentResult] = useState<PaymentNavState | null>(
    paymentState?.paymentStatus ? paymentState : null,
  )

  // Consume the router state once so a refresh/back-navigation doesn't re-show the modal.
  useEffect(() => {
    if (paymentState?.paymentStatus) {
      openCart()
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [dosageForm, setDosageForm] = useState<DosageForm | "">("")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [rxFilter, setRxFilter] = useState<"" | "true" | "false">("")
  const [page, setPage] = useState(1)

  const { data: categories } = useAllCategories()
  const { data, isLoading, isError } = useMedicines({
    search: search || undefined,
    category: category || undefined,
    dosage_form: dosageForm || undefined,
    requires_prescription: rxFilter === "" ? undefined : rxFilter === "true",
    ordering: "name",
    page,
  })
  const medicines = data?.results ?? []
  const totalCount = data?.count ?? 0

  useEffect(() => {
    setPage(1)
  }, [search, category, dosageForm, rxFilter])

  const visible = medicines.filter(
    m => m.is_active && (!inStockOnly || m.in_stock),
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Shop medicines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genuine, verified medicines. Prescription items are marked — upload yours under My account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Filter rail */}
        <aside className="h-fit space-y-4 rounded-lg border bg-card p-4 lg:sticky lg:top-20">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal size={12} /> Filters
          </p>

          <label className="block text-xs font-medium text-foreground">
            Search
            <div className="relative mt-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Paracetamol…"
                className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>

          <label className="block text-xs font-medium text-foreground">
            Category
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All categories</option>
              {(categories ?? []).filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-foreground">
            Dosage form
            <select
              value={dosageForm}
              onChange={e => setDosageForm(e.target.value as DosageForm | "")}
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All forms</option>
              {DOSAGE_FORMS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-foreground">
            Prescription
            <select
              value={rxFilter}
              onChange={e => setRxFilter(e.target.value as "" | "true" | "false")}
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All medicines</option>
              <option value="false">No prescription needed</option>
              <option value="true">Prescription required</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            In stock only
          </label>
        </aside>

        {/* Results */}
        <div>
          {isError ? (
            <EmptyState
              icon={<PackageSearch size={24} />}
              title="Could not load medicines"
              description="Refresh the page to try again."
            />
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <ShopCardSkeleton key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={24} />}
              title="No medicines match these filters"
              description="Try clearing the search or switching category."
            />
          ) : (
            <>
              <p className="tnum mb-3 text-xs text-muted-foreground">{totalCount} medicines</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {visible.map(m => <ShopCard key={m.id} medicine={m} />)}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {paymentResult?.paymentStatus && (
        <PaymentResultModal
          status={paymentResult.paymentStatus}
          transactionId={paymentResult.transactionId}
          onClose={() => setPaymentResult(null)}
        />
      )}
    </div>
  )
}

export default ShopPage
