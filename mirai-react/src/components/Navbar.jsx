import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo-footer1.png"
              alt="MIRAI Logo"
              width="80"
              height="80"
              className="h-20 w-auto invert drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-white ${pathname === link.href ? 'text-white' : 'text-gray-300'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/coming-soon" className="px-6 py-2.5 rounded-xl bg-white text-black font-bold transition-all hover:scale-105 shadow-lg">
              Download App
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-300 hover:text-white" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass-nav border-t border-white/10 mt-4 py-4 px-4 flex flex-col gap-4">
          {links.map(link => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 rounded-lg ${pathname === link.href ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/coming-soon"
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-4 py-3 rounded-full bg-primary text-[#130d26] font-medium"
          >
            Download App
          </Link>
        </div>
      )}
    </nav>
  )
}
