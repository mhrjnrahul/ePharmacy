import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "./useDebounce"

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300))
    expect(result.current).toBe("a")
  })

  it("does not update before the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe("a")
  })

  it("updates once the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe("b")
  })

  it("only reflects the last value when changed rapidly (e.g. fast typing)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "p" },
    })

    rerender({ value: "pa" })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: "par" })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: "para" })
    act(() => vi.advanceTimersByTime(100))
    // Only 100ms elapsed since the last change — should still be the original value.
    expect(result.current).toBe("p")

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe("para")
  })
})
