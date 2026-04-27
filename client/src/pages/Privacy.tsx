export const Privacy = () => {
  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Your privacy is important to us. This policy explains how we handle
            your data.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-border rounded-2xl shadow-lg p-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              1. Information We Collect
            </h2>
            <p>
              We may collect personal information such as your name, email
              address, and contact details when you interact with our website or
              submit a form.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used to respond to inquiries, improve our
              services, and communicate important updates related to The Good
              Habit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              3. Data Protection
            </h2>
            <p>
              We implement reasonable security measures to protect your personal
              data. However, no online platform is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              4. Sharing of Information
            </h2>
            <p>
              We do not sell or rent your personal information to third parties.
              Data may only be shared if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              5. Cookies
            </h2>
            <p>
              Our website may use cookies to enhance user experience. You can
              disable cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              6. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              7. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{" "}
              <span className="font-medium text-foreground">
                support@noshbob.com
              </span>
              .
            </p>
          </section>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
