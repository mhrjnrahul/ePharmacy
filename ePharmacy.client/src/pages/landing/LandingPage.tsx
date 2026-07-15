import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Navbar }            from "@/components/landing/Navbar"
import { HeroCarousel }      from "@/components/landing/HeroCarousel"
import { FeaturesSection }   from "@/components/landing/FeaturesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { MedicinesSection }  from "@/components/landing/MedicinesSection"
import { CategoriesSection } from "@/components/landing/CategoriesSection"
import { CTABanner }         from "@/components/landing/CTABanner"
import { Footer }            from "@/components/landing/Footer"

const LandingPage = () => {
  const { hash } = useLocation()

  // Navbar links use <Link to="/#hero"> etc. so navigating here from another
  // route doesn't force a full page reload — React Router doesn't auto-scroll
  // to the fragment on its own, so do it here once the section is mounted.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" })
  }, [hash])

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)", backgroundColor: "#ffffff" }}>
      <Navbar />
      <HeroCarousel />
      <MedicinesSection />
      <CategoriesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTABanner />
      <Footer />
    </div>
  )
}

export default LandingPage
