export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center text-sm font-medium text-teal-400 hover:text-teal-300 transition"
          >
            ← Back to Home
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Terms & Conditions</h1>

          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Daphstar Fitness booking platform, you accept and agree to be
                bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">2. Use of Service</h2>
              <p className="mb-2">
                Daphstar Fitness provides a fitness class booking platform for retirement village
                residents and community members. You agree to:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Provide accurate and complete information when registering</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Attend booked classes or cancel with reasonable notice</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">3. Class Bookings</h2>
              <ul className="ml-6 list-disc space-y-1">
                <li>Bookings are subject to class availability and capacity</li>
                <li>We reserve the right to cancel or reschedule classes with reasonable notice</li>
                <li>Cancellation policies apply to all bookings</li>
                <li>Late arrivals may forfeit their spot if the class is full</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">4. Session Passes</h2>
              <p>
                Session passes are valid for a specified period and number of sessions. Unused sessions
                may expire according to the terms of purchase.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">5. Health & Safety</h2>
              <p className="mb-2">
                Participants acknowledge that:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Physical exercise involves inherent risks</li>
                <li>You are responsible for consulting with a healthcare provider before participating</li>
                <li>You must inform instructors of any health conditions or limitations</li>
                <li>Daphstar Fitness is not liable for injuries sustained during classes</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">6. User Conduct</h2>
              <p className="mb-2">
                You agree not to:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Use the service for any unlawful purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Harass, abuse, or harm other participants or instructors</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">7. Intellectual Property</h2>
              <p>
                All content, trademarks, and data on this platform are the property of Daphstar Fitness
                and protected by applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">8. Limitation of Liability</h2>
              <p>
                Daphstar Fitness shall not be liable for any indirect, incidental, special, or
                consequential damages arising out of or in connection with the use of our services.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service
                after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">10. Contact</h2>
              <p>
                For questions about these terms, please contact us through the platform or at your
                retirement village reception.
              </p>
            </section>

            <p className="mt-8 text-sm text-slate-400">
              Last updated: {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
