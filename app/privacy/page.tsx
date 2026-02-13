export default function PrivacyPage() {
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
          <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>

          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">1. Information We Collect</h2>
              <p className="mb-2">
                When you use Daphstar Fitness, we collect the following information:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li><strong>Account Information:</strong> Name, email address, password</li>
                <li><strong>Profile Information:</strong> Retirement village, birthdate, phone number, address</li>
                <li><strong>Emergency Contact:</strong> Emergency contact name and phone number</li>
                <li><strong>Booking Information:</strong> Class bookings, attendance records, session pass usage</li>
                <li><strong>Usage Data:</strong> How you interact with our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">2. How We Use Your Information</h2>
              <p className="mb-2">
                We use your information to:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Provide and maintain our fitness class booking service</li>
                <li>Process your class bookings and manage your session passes</li>
                <li>Send you booking confirmations and class reminders</li>
                <li>Send birthday wishes and personalized communications</li>
                <li>Track attendance and maintain class rosters</li>
                <li>Display leaderboards and encourage community engagement</li>
                <li>Contact you in case of emergencies during classes</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">3. Information Sharing</h2>
              <p className="mb-2">
                We do not sell your personal information. We may share your information:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>With class instructors for attendance and safety purposes</li>
                <li>With your retirement village staff when necessary for service delivery</li>
                <li>With emergency contacts in case of medical emergencies</li>
                <li>When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">4. Leaderboard & Public Information</h2>
              <p>
                Your name, retirement village, and attendance count may be displayed on public
                leaderboards. This information is visible to all platform users to encourage community
                participation.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">5. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information from
                unauthorized access, alteration, disclosure, or destruction. However, no method of
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed
                to provide you services. You may request deletion of your account at any time.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">7. Cookies & Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain your login session and improve your
                experience on our platform. You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">8. Your Rights</h2>
              <p className="mb-2">
                You have the right to:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Access and update your personal information through your profile</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your personal data</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">9. Children's Privacy</h2>
              <p>
                Our service is intended for adults, particularly retirement village residents. We do not
                knowingly collect information from individuals under 18 years of age.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">10. Changes to Privacy Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes
                by posting the new policy on this page with an updated "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">11. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or how we handle your data, please
                contact us through the platform or at your retirement village reception.
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
