import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PaymentResultModal } from "./PaymentResultModal"

// Regression coverage for the eSewa payment flow fixed this session: a
// captured payment that fails to confirm (stock conflict) must never render
// as a plain "failed" state, since the customer was actually charged.
describe("PaymentResultModal", () => {
  it("shows a success message and the transaction ID", () => {
    render(<PaymentResultModal status="success" transactionId="TXN123" onClose={() => {}} />)

    expect(screen.getByText("Payment Successful!")).toBeInTheDocument()
    expect(screen.getByText("TXN123")).toBeInTheDocument()
  })

  it("shows a failed message with a Try Again action", () => {
    render(<PaymentResultModal status="failed" onClose={() => {}} />)

    expect(screen.getByText("Payment Failed")).toBeInTheDocument()
    expect(screen.getByText(/cart has not been charged/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument()
  })

  it("distinguishes a payment-captured-but-unconfirmed conflict from a clean failure", () => {
    render(
      <PaymentResultModal
        status="conflict"
        message="Your payment was received, but we couldn't reserve stock for your order."
        onClose={() => {}}
      />,
    )

    expect(screen.getByText("Payment Received — Action Needed")).toBeInTheDocument()
    expect(screen.getByText(/payment was received/i)).toBeInTheDocument()
    // Must not show the "not charged" copy from the failed state.
    expect(screen.queryByText(/cart has not been charged/i)).not.toBeInTheDocument()
  })

  it("calls onClose when the action button is clicked", async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<PaymentResultModal status="success" onClose={onClose} />)

    await user.click(screen.getByRole("button", { name: "Continue Shopping" }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
