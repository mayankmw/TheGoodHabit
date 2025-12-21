import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useContactStore } from "@/store/useContactStore";
import { toast } from "sonner";

export const Contact = () => {

  const { sendMessage, loading } = useContactStore();

const [form, setForm] = useState({
  name: "",
  email: "",
  message: "",
});

const handleSubmit = async (e) => {
  e.preventDefault();

  const res = await sendMessage(form);

  if (res.success) {
    toast.success(res.message);
    setForm({ name: "", email: "", message: "" });
  } else {
    toast.error(res.message);
  }
};


  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
            Get in Touch
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hi? We’d love to hear
            from you! Fill out the form or reach us directly through the details below.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white border border-border rounded-2xl shadow-lg p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <Input
                value={form.name}
                  type="text"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your message..."
                  className="rounded-lg min-h-[120px]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-full flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : <>
                  <Send size={16} /> Send Message
                </>}
              </Button>

            </form>
          </div>

          {/* Contact Info */}
<div className="flex flex-col justify-between">
  <div className="space-y-6 bg-white border border-border rounded-2xl shadow-md p-8">
    <h2 className="text-xl font-bold text-foreground mb-4">
      Contact Information
    </h2>

    {/* Email */}
    <a
      href="mailto:support@thegoodhabit.com"
      className="flex items-start gap-4 hover:bg-muted/40 p-2 rounded-lg transition"
    >
      <Mail className="text-primary mt-1" />
      <div>
        <h3 className="font-semibold">Email</h3>
        <p className="text-sm text-muted-foreground">
          support@thegoodhabit.com
        </p>
      </div>
    </a>

    {/* Phone */}
    <a
      href="tel:+919876543210"
      className="flex items-start gap-4 hover:bg-muted/40 p-2 rounded-lg transition"
    >
      <Phone className="text-primary mt-1" />
      <div>
        <h3 className="font-semibold">Phone</h3>
        <p className="text-sm text-muted-foreground">
          +91 98765 43210
        </p>
      </div>
    </a>

    {/* Address */}
    <a
      href="https://maps.google.com/?q=The+Good+Habit+HQ,+Bengaluru,+India"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 hover:bg-muted/40 p-2 rounded-lg transition"
    >
      <MapPin className="text-primary mt-1" />
      <div>
        <h3 className="font-semibold">Address</h3>
        <p className="text-sm text-muted-foreground">
          The Good Habit HQ, Bengaluru, India
        </p>
      </div>
    </a>
  </div>

            {/* Map Embed */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-border shadow-md">
              <iframe
                title="Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.426146469231!2d77.59456271413462!3d12.971598990857776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670f4b3c6e7%3A0xddd4d1f09d9a09!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1694018578471!5m2!1sen!2sin"
                width="100%"
                height="280"
                allowFullScreen
                loading="lazy"
                className="rounded-2xl"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
