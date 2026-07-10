import { Navbar }            from "@/components/landing/Navbar"
import { HeroCarousel }      from "@/components/landing/HeroCarousel"
import { FeaturesSection }   from "@/components/landing/FeaturesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { MedicinesSection }  from "@/components/landing/MedicinesSection"
import { CategoriesSection } from "@/components/landing/CategoriesSection"
import { CTABanner }         from "@/components/landing/CTABanner"
import { Footer }            from "@/components/landing/Footer"

const LandingPage = () => (
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

export default LandingPage
