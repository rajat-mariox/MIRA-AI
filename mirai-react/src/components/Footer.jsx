import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06040d] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link className="flex items-center gap-2 mb-4" to="/">
              <img alt="MIRAI Logo" loading="lazy" width="100" height="100" decoding="async" className="h-24 w-auto invert drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ color: 'transparent' }} src="/logo-footer1.png" />
            </Link>
            <p className="text-gray-400 max-w-sm mb-6">
              Your Personal AI Astrology Guide. Discover your Kundli, Horoscope, and Daily Predictions powered by advanced AI technology.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/terms">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link className="text-gray-400 hover:text-primary transition-colors" to="/delete-account">
                  Delete Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} MIRAI Astrology. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
              <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
            <a href="mailto:miraiaiastrology@gmail.com" className="hover:text-primary transition-colors">
              miraiaiastrology@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
