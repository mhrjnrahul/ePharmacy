import { describe, it, expect } from "vitest"
import { mediaUrl } from "./apiUrl"

describe("mediaUrl", () => {
  it("returns null for a null or undefined path", () => {
    expect(mediaUrl(null)).toBeNull()
    expect(mediaUrl(undefined)).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(mediaUrl("")).toBeNull()
  })

  it("prefixes a relative path with the API origin", () => {
    expect(mediaUrl("/media/medicines/paracetamol.jpg")).toBe(
      "http://127.0.0.1:8000/media/medicines/paracetamol.jpg",
    )
  })

  it("leaves an already-absolute URL untouched", () => {
    const absolute = "https://cdn.example.com/medicines/paracetamol.jpg"
    expect(mediaUrl(absolute)).toBe(absolute)
  })
})
