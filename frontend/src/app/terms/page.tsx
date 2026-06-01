export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: May 28, 2026</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing or using AI Radar, you agree to be bound by these Terms of Service.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Service Description</h2>
        <p>AI Radar provides AI product discovery, validation, and tracking services. We crawl public sources, validate products, and deliver insights.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. User Obligations</h2>
        <p>You must not misuse our services, attempt to access data you're not authorized to view, or use the platform for illegal purposes.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Intellectual Property</h2>
        <p>All content on AI Radar is protected by copyright. You may not reproduce or distribute our content without permission.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
        <p>AI Radar provides information "as is." We do not guarantee the accuracy or completeness of any product data.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p>
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Governing Law</h2>
        <p>These terms are governed by applicable laws. Disputes shall be resolved in the appropriate courts.</p>
      </div>
    </div>
  );
}
