import { FadeIn, StaggerContainer, StaggerItem } from '../components/Motion'
import usePageMeta from '../hooks/usePageMeta'

export default function About() {
  usePageMeta('About Us | MIRAI AI Astrology', 'Learn more about our mission, vision, and the technology powering MIRAI AI.')

  return (
    <div className="flex flex-col w-full overflow-hidden pb-24">
      <section className="relative pt-32 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <FadeIn className="z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold font-outfit mb-6">
            {'Who We '}
            <span className="text-gradient">
              Are
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            At MIRAI AI, we believe that everyone deserves access to profound self-discovery. We are bridging the 5000-year-old wisdom of Vedic astrology with the cutting-edge capabilities of Artificial Intelligence.
          </p>
        </FadeIn>
      </section>
      <section className="pb-16 pt-4 px-4 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <FadeIn direction="right">
            <div className="glass-card p-6 md:p-8 h-full border-primary/20 bg-primary/5">
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold font-outfit mb-4">
                Our Mission
              </h2>
              <p className="text-gray-300 leading-relaxed">
                To democratize access to authentic astrological guidance, making it accessible, highly personalized, and context-aware for every individual, regardless of their prior knowledge of astrology.
              </p>
            </div>
          </FadeIn>
          <FadeIn direction="left">
            <div className="glass-card p-6 md:p-8 h-full border-accent/20 bg-accent/5">
              <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles" aria-hidden="true">
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  <path d="M20 2v4" />
                  <path d="M22 4h-4" />
                  <circle cx="4" cy="20" r="2" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold font-outfit mb-4">
                Our Vision
              </h2>
              <p className="text-gray-300 leading-relaxed">
                To become the ultimate celestial companion for millions worldwide, empowering them to make informed decisions and navigate life&#x27;s uncertainties with confidence and clarity.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
      <section className="py-24 px-4 bg-[#0a0614] border-y border-white/5 mt-16">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">
              Our Technology
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The perfect synergy of ancient logic and modern computing.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn>
              <div className="glass-card p-6 md:p-8 h-full text-center flex flex-col items-center hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain" aria-hidden="true">
                    <path d="M12 18V5" />
                    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
                    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
                    <path d="M18 18a4 4 0 0 0 2-7.464" />
                    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
                    <path d="M6 18a4 4 0 0 1-2-7.464" />
                    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Context-Aware AI
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our proprietary NLP engine understands your life situations, providing nuanced advice rather than generic predictions.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="glass-card p-6 md:p-8 h-full text-center flex flex-col items-center hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true">
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Precision Astro Engine
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Calculates planetary positions down to the microsecond, factoring in Ayanamsa and precise geographical coordinates.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="glass-card p-6 md:p-8 h-full text-center flex flex-col items-center hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield" aria-hidden="true">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Enterprise Security
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your birth details are encrypted at rest and in transit. We prioritize your privacy above all else.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">
              Our Values
            </h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#130d26] hover:border-primary/50 transition-colors">
                <div className="text-accent mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  Precision
                </h4>
                <p className="text-gray-400 text-sm">
                  Uncompromising accuracy in every astrological calculation.
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#130d26] hover:border-primary/50 transition-colors">
                <div className="text-accent mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield" aria-hidden="true">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  Privacy
                </h4>
                <p className="text-gray-400 text-sm">
                  Your personal data is encrypted and strictly confidential.
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#130d26] hover:border-primary/50 transition-colors">
                <div className="text-accent mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  Empathy
                </h4>
                <p className="text-gray-400 text-sm">
                  Compassionate AI that understands your unique life journey.
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="p-6 rounded-2xl border border-white/10 bg-[#130d26] hover:border-primary/50 transition-colors">
                <div className="text-accent mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain" aria-hidden="true">
                    <path d="M12 18V5" />
                    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
                    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
                    <path d="M18 18a4 4 0 0 0 2-7.464" />
                    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
                    <path d="M6 18a4 4 0 0 1-2-7.464" />
                    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
                  </svg>
                </div>
                <h4 className="font-bold text-lg mb-2">
                  Innovation
                </h4>
                <p className="text-gray-400 text-sm">
                  Continuously evolving algorithms bridging ancient wisdom and modern tech.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}
