import usePageMeta from '../hooks/usePageMeta'

export default function Terms() {
  usePageMeta('Terms & Conditions | MIRAI Astrology', 'Terms and conditions of using the MIRAI Astrology platform.')

  return (
    <div className="max-w-4xl mx-auto px-4 py-32">
      <h1 className="text-4xl md:text-5xl font-bold font-outfit mb-6 text-center">
        Terms &amp; Conditions
      </h1>
      <p className="text-gray-400 mb-16 text-center">
        Last Updated: October 2023
      </p>
      <div className="space-y-10 text-gray-300 leading-relaxed bg-[#0a0614] p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl">
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the MIRAI AI Astrology mobile application or website (collectively, the &quot;Service&quot;), you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the Service.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            2. Accounts
          </h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            3. Subscriptions &amp; Payments
          </h2>
          <p>
            Some parts of the Service are billed on a subscription basis (&quot;Subscription(s)&quot;). You will be billed in advance on a recurring and periodic basis. Payments are processed securely via third-party providers (Apple App Store, Google Play Store, or Stripe).
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            4. AI Generated Content
          </h2>
          <p>
            The astrological readings, horoscopes, and chat responses are generated using Artificial Intelligence based on astrological principles. This content is for entertainment and informational purposes only. It should not be treated as professional medical, legal, or financial advice.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            5. Intellectual Property
          </h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of MIRAI AI and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            6. Refund Policy
          </h2>
          <p>
            Except when required by law, paid Subscription fees are non-refundable. Certain refund requests for Subscriptions may be considered by MIRAI AI on a case-by-case basis and granted at the sole discretion of the company.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            7. Limitation of Liability
          </h2>
          <p>
            In no event shall MIRAI AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold font-outfit text-white mb-4">
            8. Contact Us
          </h2>
          <p>
            {'If you have any questions about these Terms, please contact us at: '}
            <br />
            <a href="mailto:miraiaiastrology@gmail.com" className="text-primary hover:underline">
              miraiaiastrology@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
