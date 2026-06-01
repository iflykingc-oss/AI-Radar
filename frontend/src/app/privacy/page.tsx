export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: May 28, 2026</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly, such as your email address, name, and usage preferences when you create an account.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information to provide, maintain, and improve our services, including personalized product recommendations and notifications.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing</h2>
        <p>We do not sell your personal information. We may share data with service providers who assist in operating our platform.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Your Rights</h2>
        <p>You have the right to access, correct, delete, and export your personal data. Contact us at privacy@airadar.ai for any data requests.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Security</h2>
        <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookies</h2>
        <p>We use essential cookies for authentication and optional analytics cookies. You can manage your preferences in Cookie Settings.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact Us</h2>
        <p>For any privacy questions, contact us at <a href="mailto:privacy@airadar.ai" className="text-primary">privacy@airadar.ai</a>.</p>
      </div>
    </div>
  );
}
