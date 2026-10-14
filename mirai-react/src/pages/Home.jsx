import { Link } from 'react-router-dom'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Motion'
import usePageMeta from '../hooks/usePageMeta'

export default function Home() {
  usePageMeta('MIRAI | Your Personal AI Astrology Guide', 'Discover your Kundli, Horoscope, Daily Predictions and AI-powered Astrology Guidance—all personalized according to your birth details.')

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 px-4 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-50 mix-blend-screen pointer-events-none">
            <svg viewBox="0 0 1000 1000" className="w-[800px] h-[800px] md:w-[1200px] md:h-[1200px] max-w-none opacity-80">
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#A4E0F0" stopOpacity="1" />
                  <stop offset="40%" stopColor="#307797" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#130d26" stopOpacity="0" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="500" cy="500" r="70" fill="url(#sunGlow)" filter="url(#glow)" className="animate-pulse" style={{ animationDuration: '4s' }} />
              <g className="animate-[spin_60s_linear_infinite]">
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(0 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(30 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(60 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(90 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(120 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(150 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(180 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(210 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(240 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(270 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(300 500 500)" />
                <line x1="500" y1="410" x2="500" y2="425" stroke="#A4E0F0" strokeWidth="2" opacity="0.4" transform="rotate(330 500 500)" />
              </g>
              <g className="animate-[spin_40s_linear_infinite]">
                <circle cx="500" cy="500" r="180" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx="500" cy="320" r="8" fill="#ff7f50" filter="url(#glow)" />
                <circle cx="627" cy="627" r="5" fill="#A4E0F0" filter="url(#glow)" />
                <path d="M 500 320 L 627 627 M 627 627 L 400 600 M 400 600 L 450 400" stroke="rgba(255,127,80,0.4)" strokeWidth="1.5" fill="none" />
                <circle cx="400" cy="600" r="4" fill="#ff7f50" />
                <circle cx="450" cy="400" r="4" fill="#ff7f50" />
              </g>
              <g className="animate-[spin_80s_linear_infinite_reverse]">
                <circle cx="500" cy="500" r="280" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx="780" cy="500" r="12" fill="#eaddcf" filter="url(#glow)" />
                <circle cx="280" cy="320" r="6" fill="#7fff00" filter="url(#glow)" />
                <path d="M 780 500 L 700 300 M 700 300 L 550 240 M 550 240 L 450 250" stroke="rgba(234,221,207,0.4)" strokeWidth="1.5" fill="none" />
                <circle cx="700" cy="300" r="5" fill="#eaddcf" />
                <circle cx="550" cy="240" r="4" fill="#eaddcf" />
                <circle cx="450" cy="250" r="4" fill="#eaddcf" />
              </g>
              <g className="animate-[spin_120s_linear_infinite]">
                <circle cx="500" cy="500" r="400" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="10 15" />
                <circle cx="500" cy="500" r="460" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <g transform="translate(930, 500)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(90)">
                    ♈
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(90)" />
                </g>
                <g transform="translate(872.3909236273087, 715)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(120)">
                    ♉
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(120)" />
                </g>
                <g transform="translate(715, 872.3909236273087)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(150)">
                    ♊
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(150)" />
                </g>
                <g transform="translate(500, 930)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(180)">
                    ♋
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(180)" />
                </g>
                <g transform="translate(285.0000000000001, 872.3909236273087)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(210)">
                    ♌
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(210)" />
                </g>
                <g transform="translate(127.60907637269133, 715)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(240)">
                    ♍
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(240)" />
                </g>
                <g transform="translate(70, 500.00000000000006)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(270)">
                    ♎
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(270)" />
                </g>
                <g transform="translate(127.60907637269139, 284.99999999999994)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(300)">
                    ♏
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(300)" />
                </g>
                <g transform="translate(284.9999999999998, 127.60907637269145)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(330)">
                    ♐
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(330)" />
                </g>
                <g transform="translate(499.99999999999994, 70)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(360)">
                    ♑
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(360)" />
                </g>
                <g transform="translate(715, 127.60907637269139)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(390)">
                    ♒
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(390)" />
                </g>
                <g transform="translate(872.3909236273084, 284.9999999999998)">
                  <text x="0" y="0" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle" transform="rotate(420)">
                    ♓
                  </text>
                  <line x1="0" y1="-25" x2="0" y2="-35" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(420)" />
                </g>
              </g>
              <g className="animate-[spin_200s_linear_infinite]">
                <circle cx="650" cy="500" r="1" fill="#fff" opacity="0.2" />
                <circle cx="383.5101807840004" cy="606.7432528032743" r="1.5" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="514.4678532961112" cy="334.6316801167702" r="2" fill="#fff" opacity="0.4" />
                <circle cx="605.9244886475175" cy="638.0434812106748" r="1" fill="#fff" opacity="0.5" />
                <circle cx="320.76498895177815" cy="468.39603166461876" r="1.5" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="660.2443747044482" cy="397.91307441410333" r="2" fill="#fff" opacity="0.2" />
                <circle cx="448.75382906970106" cy="691.2533136052356" r="1" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="404.87978567358317" cy="317.27576836528624" r="1.5" fill="#fff" opacity="0.4" />
                <circle cx="701.0942208481845" cy="573.1923106716929" r="2" fill="#fff" opacity="0.5" />
                <circle cx="294.8987437824943" cy="584.9557219850499" r="1" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="597.2022002003606" cy="291.54920898157036" r="1.5" fill="#fff" opacity="0.2" />
                <circle cx="571.567980282017" cy="726.984634278078" r="2" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="286.95775066902786" cy="377.00000000000034" r="1" fill="#fff" opacity="0.4" />
                <circle cx="747.9791858084631" cy="445.02433805972186" r="1.5" fill="#fff" opacity="0.5" />
                <circle cx="349.7229736760256" cy="714.6178356037155" r="2" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="464.75792810058596" cy="232.30988742907118" r="1" fill="#fff" opacity="0.2" />
                <circle cx="712.9603551870763" cy="678.6949554928574" r="1.5" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="214.27220862758872" cy="512.4751447864872" r="2" fill="#fff" opacity="0.4" />
                <circle cx="707.8893936688452" cy="292.1106063311553" r="1" fill="#fff" opacity="0.5" />
                <circle cx="486.8269450156688" cy="801.712562917721" r="1.5" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="300.73584099717215" cy="262.52622263311736" r="2" fill="#fff" opacity="0.2" />
                <circle cx="815.2794659168717" cy="541.5073291259771" r="1" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="232.95643356178863" cy="686.9859182504409" r="1.5" fill="#fff" opacity="0.4" />
                <circle cx="572.2908310553258" cy="173.91713362194213" r="2" fill="#fff" opacity="0.5" />
                <circle cx="671.000000000001" cy="796.1806880942775" r="1" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="166.1990672381208" cy="394.75297017350385" r="1.5" fill="#fff" opacity="0.2" />
                <circle cx="824.4581877591206" cy="348.70266229682954" r="2" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="359.9378637543755" cy="838.1399088991302" r="1" fill="#fff" opacity="0.4" />
                <circle cx="372.084466396201" cy="148.55495982606988" r="1.5" fill="#fff" opacity="0.5" />
                <circle cx="838.8381382740805" cy="676.3879702557833" r="2" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="123.28892774726347" cy="600.9394275899833" r="1" fill="#fff" opacity="0.2" />
                <circle cx="713.845244122035" cy="164.3302045664709" r="1.5" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="570.5011601327756" cy="899.8319477229561" r="2" fill="#fff" opacity="0.4" />
                <circle cx="171.551717119427" cy="247.97276839039176" r="1" fill="#fff" opacity="0.5" />
                <circle cx="920.3941625947164" cy="463.2202765604847" r="1.5" fill="#fff" opacity="0.6000000000000001" />
                <circle cx="209.49621072526486" cy="817.0292548283522" r="2" fill="#fff" opacity="0.2" />
                <circle cx="500.00000000000085" cy="62" r="1" fill="#fff" opacity="0.30000000000000004" />
                <circle cx="801.3132325965844" cy="828.8256922173153" r="1.5" fill="#fff" opacity="0.4" />
                <circle cx="47.727607066347446" cy="460.431292792564" r="2" fill="#fff" opacity="0.5" />
                <circle cx="866.5292432145495" cy="218.75221979796964" r="1" fill="#fff" opacity="0.6000000000000001" />
              </g>
            </svg>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
        </div>
        <FadeIn className="z-10 text-center max-w-4xl mx-auto">
          <span className="text-xs font-bold tracking-widest uppercase text-primary drop-shadow-md mb-6 block">
            MIRAI Unlocking The Secrets Of Astrology
          </span>
          <h1 className="text-5xl md:text-7xl font-bold font-outfit mb-6 leading-tight">
            {'Your Personal '}
            <br />
            <span className="text-gradient">
              AI Astrology Guide
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover your Kundli, Horoscope, Daily Predictions and AI-powered Astrology Guidance—all personalized according to your birth details.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/coming-soon" className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform border border-white/20 shadow-lg">
              <svg viewBox="0 0 384 512" className="w-7 h-7 fill-current">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none mb-1 text-gray-300">
                  Download on the
                </span>
                <span className="text-base font-semibold leading-none">
                  App Store
                </span>
              </div>
            </Link>
            <Link to="/coming-soon" className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform border border-white/20 shadow-lg">
              <svg viewBox="0 0 512 512" className="w-7 h-7 fill-current">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none mb-1 text-gray-300">
                  GET IT ON
                </span>
                <span className="text-base font-semibold leading-none">
                  Google Play
                </span>
              </div>
            </Link>
          </div>
        </FadeIn>
      </section>
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-[#0B0818]/80 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">
              Premium Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to navigate your life&#x27;s journey.
            </p>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  User Profile &amp; Setup
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard" aria-hidden="true">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Daily Dashboard
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star" aria-hidden="true">
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Kundli Generation
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-compass" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Detailed Insights
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true">
                    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  AI AstroChat
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" aria-hidden="true">
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Daily Horoscopes
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles" aria-hidden="true">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                    <path d="M20 2v4" />
                    <path d="M22 4h-4" />
                    <circle cx="4" cy="20" r="2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Spiritual Guidance
                </h3>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-accent flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell" aria-hidden="true">
                    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-200">
                  Alerts &amp; Transits
                </h3>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      <section className="py-24 px-4 bg-[#0a0614] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">
              How It Works
            </h2>
            <p className="text-gray-400">
              Your journey to celestial wisdom in 5 simple steps.
            </p>
          </FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-between relative">
            <div className="hidden md:block absolute top-[32px] left-10 right-10 h-0 border-t-2 border-dashed border-primary/40 z-0" />
            <StaggerContainer className="flex flex-col md:flex-row w-full justify-between gap-8 z-10">
              <StaggerItem className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#130d26] border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-accent mb-4 shadow-[0_0_20px_rgba(109,58,255,0.2)]">
                  1
                </div>
                <h4 className="font-semibold text-center text-gray-200">
                  Signup &amp; Verify
                </h4>
              </StaggerItem>
              <StaggerItem className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#130d26] border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-accent mb-4 shadow-[0_0_20px_rgba(109,58,255,0.2)]">
                  2
                </div>
                <h4 className="font-semibold text-center text-gray-200">
                  Enter Birth Details
                </h4>
              </StaggerItem>
              <StaggerItem className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#130d26] border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-accent mb-4 shadow-[0_0_20px_rgba(109,58,255,0.2)]">
                  3
                </div>
                <h4 className="font-semibold text-center text-gray-200">
                  Generate Kundli
                </h4>
              </StaggerItem>
              <StaggerItem className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#130d26] border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-accent mb-4 shadow-[0_0_20px_rgba(109,58,255,0.2)]">
                  4
                </div>
                <h4 className="font-semibold text-center text-gray-200">
                  Explore Insights
                </h4>
              </StaggerItem>
              <StaggerItem className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#130d26] border-2 border-primary/50 flex items-center justify-center text-2xl font-bold text-accent mb-4 shadow-[0_0_20px_rgba(109,58,255,0.2)]">
                  5
                </div>
                <h4 className="font-semibold text-center text-gray-200">
                  Chat with AI
                </h4>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </section>
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <FadeIn direction="right" className="flex-1">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-6">
              {'Why Choose '}
              <span className="text-gradient">
                MIRAI
              </span>
              ?
            </h2>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              Experience the perfect blend of ancient Vedic wisdom and cutting-edge Artificial Intelligence. MIRAI doesn&#x27;t just read stars; it understands you.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-accent min-w-[24px]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-gray-200 text-lg">
                  Context-aware AI AstroChat
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-accent min-w-[24px]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-gray-200 text-lg">
                  Detailed Kundli &amp; Dasha analysis
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-accent min-w-[24px]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-gray-200 text-lg">
                  Personalized House &amp; Planet predictions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-accent min-w-[24px]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-gray-200 text-lg">
                  Festival Calendar &amp; Muhurat guidance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-accent min-w-[24px]" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-gray-200 text-lg">
                  Real-time planetary transit alerts
                </span>
              </div>
            </div>
          </FadeIn>
          <FadeIn direction="left" className="flex-1 w-full max-w-xl mx-auto flex justify-center items-center relative min-h-[500px] md:min-h-[600px] mt-10 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-full blur-[100px] opacity-20 animate-pulse" />
            <div className="group absolute left-0 md:left-4 lg:-left-4 w-[180px] md:w-[220px] aspect-[9/19] rounded-[2rem] border-[8px] border-[#130d26] bg-[#0B0818] overflow-hidden shadow-2xl -rotate-12 scale-90 z-10 opacity-70 hover:opacity-100 hover:z-30 hover:scale-100 hover:-rotate-6 transition-all duration-500">
              <img alt="App Screen Left" loading="lazy" decoding="async" className="object-cover" style={{ position: 'absolute', height: '100%', width: '100%', left: '0', top: '0', right: '0', bottom: '0', color: 'transparent' }} src="/app-mockup.png" />
              <div className="absolute inset-0 bg-[#0B0818]/60 group-hover:bg-transparent transition-all duration-500 pointer-events-none" />
            </div>
            <div className="group absolute right-0 md:right-4 lg:-right-4 w-[180px] md:w-[220px] aspect-[9/19] rounded-[2rem] border-[8px] border-[#130d26] bg-[#0B0818] overflow-hidden shadow-2xl rotate-12 scale-90 z-10 opacity-70 hover:opacity-100 hover:z-30 hover:scale-100 hover:rotate-6 transition-all duration-500">
              <img alt="App Screen Right" loading="lazy" decoding="async" className="object-cover" style={{ position: 'absolute', height: '100%', width: '100%', left: '0', top: '0', right: '0', bottom: '0', color: 'transparent' }} src="/app-mockup-2.png" />
              <div className="absolute inset-0 bg-[#0B0818]/60 group-hover:bg-transparent transition-all duration-500 pointer-events-none" />
            </div>
            <div className="relative w-[220px] md:w-[260px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-[#130d26] bg-[#0B0818] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 hover:scale-105 transition-transform duration-500">
              <img alt="Main App Screen" loading="lazy" decoding="async" className="object-cover" style={{ position: 'absolute', height: '100%', width: '100%', left: '0', top: '0', right: '0', bottom: '0', color: 'transparent' }} src="/app-mockup-3.png" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0818] to-transparent pointer-events-none opacity-20" />
            </div>
          </FadeIn>
        </div>
      </section>
      <section className="py-32 px-4 bg-[#0a0614] border-t border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeIn className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-accent mb-4 block">
              Frequently Asked
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-outfit mb-4">
              Questions, before you
              <br />
              ask one.
            </h2>
          </FadeIn>
          <StaggerContainer className="flex flex-col gap-4">
            <StaggerItem>
              <details className="group bg-[#130d26]/80 border border-white/10 rounded-2xl p-6 md:px-8 cursor-pointer [&amp;_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                <summary className="flex items-center justify-between font-semibold text-lg text-white outline-none">
                  <span>
                    What does the Kundli feature include?
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 group-open:bg-primary group-open:text-[#130d26] group-open:border-primary transition-all flex-shrink-0 ml-4">
                    <span className="group-open:hidden text-xl leading-none font-light">
                      +
                    </span>
                    <span className="hidden group-open:block text-xl leading-none font-light">
                      ×
                    </span>
                  </div>
                </summary>
                <div className="pt-4 mt-4 border-t border-white/10 text-gray-400 leading-relaxed">
                  The app generates a detailed birth chart (Lagna, Navamsa), analyzes planetary positions, house-wise details, Yogas, and basic Doshas.
                </div>
              </details>
            </StaggerItem>
            <StaggerItem>
              <details className="group bg-[#130d26]/80 border border-white/10 rounded-2xl p-6 md:px-8 cursor-pointer [&amp;_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                <summary className="flex items-center justify-between font-semibold text-lg text-white outline-none">
                  <span>
                    How does the AI AstroChat work?
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 group-open:bg-primary group-open:text-[#130d26] group-open:border-primary transition-all flex-shrink-0 ml-4">
                    <span className="group-open:hidden text-xl leading-none font-light">
                      +
                    </span>
                    <span className="hidden group-open:block text-xl leading-none font-light">
                      ×
                    </span>
                  </div>
                </summary>
                <div className="pt-4 mt-4 border-t border-white/10 text-gray-400 leading-relaxed">
                  You can ask context-aware questions. The AI evaluates your unique Kundli to provide highly personalized answers and remembers chat history for follow-ups.
                </div>
              </details>
            </StaggerItem>
            <StaggerItem>
              <details className="group bg-[#130d26]/80 border border-white/10 rounded-2xl p-6 md:px-8 cursor-pointer [&amp;_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                <summary className="flex items-center justify-between font-semibold text-lg text-white outline-none">
                  <span>
                    Does the app provide spiritual guidance?
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 group-open:bg-primary group-open:text-[#130d26] group-open:border-primary transition-all flex-shrink-0 ml-4">
                    <span className="group-open:hidden text-xl leading-none font-light">
                      +
                    </span>
                    <span className="hidden group-open:block text-xl leading-none font-light">
                      ×
                    </span>
                  </div>
                </summary>
                <div className="pt-4 mt-4 border-t border-white/10 text-gray-400 leading-relaxed">
                  Yes, you can access festival calendars, auspicious Muhurat timings, basic remedies, and mantra-based guidance.
                </div>
              </details>
            </StaggerItem>
            <StaggerItem>
              <details className="group bg-[#130d26]/80 border border-white/10 rounded-2xl p-6 md:px-8 cursor-pointer [&amp;_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                <summary className="flex items-center justify-between font-semibold text-lg text-white outline-none">
                  <span>
                    Will I receive daily updates?
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 group-open:bg-primary group-open:text-[#130d26] group-open:border-primary transition-all flex-shrink-0 ml-4">
                    <span className="group-open:hidden text-xl leading-none font-light">
                      +
                    </span>
                    <span className="hidden group-open:block text-xl leading-none font-light">
                      ×
                    </span>
                  </div>
                </summary>
                <div className="pt-4 mt-4 border-t border-white/10 text-gray-400 leading-relaxed">
                  Absolutely. You can opt-in to receive daily horoscope notifications, important planetary transit alerts, and festival reminders.
                </div>
              </details>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      <section className="relative py-24 lg:py-32 px-4 flex items-center justify-center" id="download">
        <FadeIn className="z-10 w-full max-w-6xl mx-auto relative">
          <div className="w-full glass-card rounded-[2.5rem] p-8 md:p-12 lg:p-20 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden bg-[#130d26]/40 border-primary/20">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex-1 text-left z-10 flex flex-col items-start">
              <span className="text-xs font-bold tracking-widest uppercase text-accent mb-4">
                MIRAI FOR IOS &amp; ANDROID
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-outfit mb-6 leading-tight text-white">
                {'The #1 AI '}
                <br />
                astrology app.
                <br />
                <span className="text-gradient">
                  Always with you.
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 mb-10 max-w-lg leading-relaxed">
                Chat with AI astrologers anytime. Get daily horoscopes, free Kundli, detailed planetary insights &amp; transit alerts — all in one app.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/coming-soon" className="flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-xl hover:scale-105 transition-transform border border-white/20 shadow-lg">
                  <svg viewBox="0 0 384 512" className="w-6 h-6 fill-current">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none mb-1 text-gray-300">
                      Download on the
                    </span>
                    <span className="text-sm font-semibold leading-none">
                      App Store
                    </span>
                  </div>
                </Link>
                <Link to="/coming-soon" className="flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-xl hover:scale-105 transition-transform border border-white/20 shadow-lg">
                  <svg viewBox="0 0 512 512" className="w-6 h-6 fill-current">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] leading-none mb-1 text-gray-300">
                      GET IT ON
                    </span>
                    <span className="text-sm font-semibold leading-none">
                      Google Play
                    </span>
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end w-full relative z-10 mt-10 md:mt-0">
              <div className="relative w-[240px] md:w-[280px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-[#130d26] bg-[#0B0818] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-3 hover:rotate-0 transition-all duration-500">
                <img alt="MIRAI App Screen" loading="lazy" decoding="async" className="object-cover" style={{ position: 'absolute', height: '100%', width: '100%', left: '0', top: '0', right: '0', bottom: '0', color: 'transparent' }} src="/app-mockup.png" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0818] to-transparent pointer-events-none opacity-20" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
