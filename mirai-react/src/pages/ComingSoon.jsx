import { Link } from 'react-router-dom'
import { FadeIn } from '../components/Motion'
import CountdownTimer from '../components/CountdownTimer'
import usePageMeta from '../hooks/usePageMeta'

export default function ComingSoon() {
  usePageMeta('Coming Soon | MIRAI AI Astrology', 'The ultimate celestial companion is almost here.')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[120px]" />
      </div>
      <div className="z-10 w-full max-w-4xl mx-auto text-center mt-20">
        <FadeIn direction="down" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles" aria-hidden="true">
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
            <path d="M20 2v4" />
            <path d="M22 4h-4" />
            <circle cx="4" cy="20" r="2" />
          </svg>
          <span>
            Almost Ready to Launch
          </span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-bold font-outfit mb-6">
            {'The Stars are '}
            <span className="text-gradient">
              Aligning
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            The MIRAI AI Astrology app will be available on the App Store and Google Play Store soon. Get ready to embark on a journey of profound self-discovery.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <CountdownTimer targetDate="2026-09-20T23:59:59" />
        </FadeIn>
        <FadeIn delay={0.4}>
          <Link className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-8" to="/">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left" aria-hidden="true">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>
              Return to Home
            </span>
          </Link>
        </FadeIn>
      </div>
    </div>
  )
}
