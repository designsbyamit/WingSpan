export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#23262F] text-white px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 font-sora">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: July 31, 2026</p>

      <section className="flex flex-col gap-8 text-sm text-gray-300 leading-relaxed">
        <div>
          <h2 className="text-white font-semibold text-base mb-2">1. What we collect</h2>
          <p>When you sign in with Google, we collect your name and email address. When you upload a resume or portfolio, we process that content to generate your career Blueprint. We do not store your resume files — they are processed in memory and discarded.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">2. How we use your data</h2>
          <p>Your email is used to identify your account. Your career data is used solely to generate your Blueprint and personalise your learning experience on the Design Evolution platform. We do not sell your data to third parties.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">3. AI processing</h2>
          <p>Career analysis is powered by Groq (Llama) and Google Gemini APIs. Your resume text is sent to these services for processing. Please review their respective privacy policies for how they handle input data.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">4. Data storage</h2>
          <p>Your account data (name, email, learning progress) is stored in a secure PostgreSQL database hosted on Neon. We use industry-standard encryption in transit and at rest.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">5. Cookies</h2>
          <p>We use a single HTTP-only session cookie to keep you signed in. No tracking or advertising cookies are used.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">6. Your rights</h2>
          <p>You can request deletion of your account and all associated data at any time by emailing us. We will process deletion requests within 30 days.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-2">7. Contact</h2>
          <p>For privacy-related questions, contact us at <a href="mailto:uxbyamit@gmail.com" className="text-[#B6FF2E] underline">uxbyamit@gmail.com</a></p>
        </div>
      </section>
    </div>
  )
}
