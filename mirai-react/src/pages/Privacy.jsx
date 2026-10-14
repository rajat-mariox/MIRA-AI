import usePageMeta from '../hooks/usePageMeta'

export default function Privacy() {
  usePageMeta('Privacy Policy | MIRAI AI Astrology', 'Learn how MIRAI AI protects and handles your personal information.')

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col md:flex-row gap-12">
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-32 glass-card p-6 border-white/5">
          <h3 className="font-outfit font-bold text-lg mb-4 text-white">
            Contents
          </h3>
          <nav className="flex flex-col gap-3">
            <a href="#information-collection" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Information Collection
            </a>
            <a href="#birth-information" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Birth Information
            </a>
            <a href="#cookies" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Cookies
            </a>
            <a href="#security" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Security
            </a>
            <a href="#third-party" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Third Party Services
            </a>
            <a href="#retention" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Data Retention
            </a>
            <a href="#children" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Children&#x27;s Privacy
            </a>
            <a href="#rights" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Your Rights
            </a>
            <a href="#contact" className="text-sm text-gray-400 hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </aside>
      <main className="flex-1 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold font-outfit mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-400 mb-12">
          Last Updated: October 2023
        </p>
        <div className="space-y-12 text-gray-300 leading-relaxed">
          <section id="information-collection" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              1. Information Collection
            </h2>
            <p>
              We collect information to provide better services to all our users. The types of personal information we obtain include your name, email address, and demographic information when you register for an account.
            </p>
          </section>
          <section id="birth-information" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              2. Birth Information
            </h2>
            <p>
              To provide accurate astrological readings and Kundli generation, MIRAI AI requires your exact date of birth, time of birth, and place of birth. This sensitive data is strictly used for astrological calculations and is never sold to third parties.
            </p>
          </section>
          <section id="cookies" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              3. Cookies
            </h2>
            <p>
              Our application and website use &quot;cookies&quot; to enhance User experience. Your web browser places cookies on your hard drive for record-keeping purposes and sometimes to track information about them. You may choose to set your web browser to refuse cookies.
            </p>
          </section>
          <section id="security" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              4. Security
            </h2>
            <p>
              We adopt appropriate data collection, storage, and processing practices and security measures (including end-to-end encryption) to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, and transaction information.
            </p>
          </section>
          <section id="third-party" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              5. Third Party Services
            </h2>
            <p>
              We may use third-party service providers to help us operate our business and the Site or administer activities on our behalf, such as sending out newsletters or surveys. We may share your information with these third parties for those limited purposes provided that you have given us your permission.
            </p>
          </section>
          <section id="retention" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              6. Data Retention
            </h2>
            <p>
              We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. You can request the deletion of your account and associated birth data at any time through the app settings.
            </p>
          </section>
          <section id="children" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              7. Children&#x27;s Privacy
            </h2>
            <p>
              Our services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
            </p>
          </section>
          <section id="rights" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              8. Your Rights
            </h2>
            <p>
              You have the right to access, update, or delete the information we have on you. You can do this directly within your account settings section. If you are unable to perform these actions yourself, please contact us to assist you.
            </p>
          </section>
          <section id="contact" className="scroll-mt-32">
            <h2 className="text-2xl font-bold font-outfit text-white mb-4">
              9. Contact Us
            </h2>
            <p>
              {'If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at: '}
              <br />
              <a href="mailto:miraiaiastrology@gmail.com" className="text-primary hover:underline">
                miraiaiastrology@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
