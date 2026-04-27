export const Terms = () => {
  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground">
            Please read these terms carefully before using NoshBOB.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-border rounded-2xl shadow-lg p-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using NoshBOB website, you agree to be bound
              by these Terms & Conditions. If you do not agree, please do not use
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              2. Use of Our Services
            </h2>
            <p>
              You agree to use our website only for lawful purposes and in a way
              that does not infringe the rights of others or restrict their use
              of the site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              3. Intellectual Property
            </h2>
            <p>
              All content, branding, designs, logos, and materials on this site
              are the property of NoshBOB and may not be copied or reused
              without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              4. Limitation of Liability
            </h2>
            <p>
              We are not liable for any direct, indirect, or incidental damages
              arising from your use of our website or services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              5. Changes to Terms
            </h2>
            <p>
              We reserve the right to update these terms at any time. Continued
              use of the website constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              6. Contact Us
            </h2>
            <p>
              If you have any questions regarding these Terms & Conditions, you
              can contact us at{" "}
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

export default Terms;
