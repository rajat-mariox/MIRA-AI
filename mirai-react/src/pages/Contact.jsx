import { FadeIn } from '../components/Motion'
import ContactForm from '../components/ContactForm'
import usePageMeta from '../hooks/usePageMeta'

export default function Contact() {
  usePageMeta('MIRAI | Your Personal AI Astrology Guide', 'Discover your Kundli, Horoscope, Daily Predictions and AI-powered Astrology Guidance—all personalized according to your birth details.')

  return (
    <div className="flex flex-col w-full overflow-hidden pb-24">
      <section className="relative pt-32 pb-4 lg:pb-6 px-4 text-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        </div>
        <FadeIn className="z-10 relative">
          <h1 className="text-4xl md:text-6xl font-bold font-outfit mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Have questions about your Kundli or our AI platform? We&#x27;re here to help you navigate your journey.
          </p>
        </FadeIn>
      </section>
      <section className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        <FadeIn direction="right" className="h-full">
          <div className="glass-card p-6 md:p-8 !p-8 md:!p-12 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-transform duration-700 group-hover:scale-150 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold font-outfit mb-10">
                Contact Information
              </h2>
              <div className="flex flex-col gap-8 mb-12">
                <div className="flex items-center gap-6 group/item">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:bg-primary group-hover/item:text-[#130d26] shadow-[0_0_15px_rgba(164,224,240,0)] group-hover/item:shadow-[0_0_20px_rgba(164,224,240,0.5)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
                      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg mb-1">
                      Email Us
                    </h4>
                    <a href="mailto:miraiaiastrology@gmail.com" className="text-gray-400 hover:text-primary transition-colors text-base">
                      miraiaiastrology@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-6 group/item">
                  <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:bg-accent group-hover/item:text-white shadow-[0_0_15px_rgba(109,58,255,0)] group-hover/item:shadow-[0_0_20px_rgba(109,58,255,0.5)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true">
                      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg mb-1">
                      Call Us
                    </h4>
                    <p className="text-gray-400 text-base">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group/item">
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:bg-primary group-hover/item:text-[#130d26] shadow-[0_0_15px_rgba(164,224,240,0)] group-hover/item:shadow-[0_0_20px_rgba(164,224,240,0.5)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" aria-hidden="true">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg mb-1">
                      Office Address
                    </h4>
                    <p className="text-gray-400 text-base">
                      {'30 N Gould St Ste R, '}
                      <br />
                      Sheridan, WY 82801
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-auto pt-10 border-t border-white/5">
              <h4 className="font-semibold text-white mb-6">
                Follow Us
              </h4>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all border border-white/5 hover:border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all border border-white/5 hover:border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all border border-white/5 hover:border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
        <FadeIn direction="left" className="h-full">
          <div className="glass-card p-6 md:p-8 !p-8 md:!p-12 h-full border-primary/20 flex flex-col">
            <h2 className="text-3xl font-bold font-outfit mb-10">
              Send a Message
            </h2>
            <ContactForm />
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
