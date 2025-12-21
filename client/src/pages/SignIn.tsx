import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

export const SignIn = () => {
  const navigate = useNavigate();

  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await sendOtp(email);

    if (res.success) {
      toast.success(res.message);
      setStep("otp");
    } else {
      toast.error(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await verifyOtp(email, otp);

    if (res.success) {
      toast.success(res.message);
      navigate("/profile");
    } else {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/profile");
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-amber-50 to-white px-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-md p-8 animate-fadeIn">

      <div className="flex justify-center mb-8">
        <div className="bg-primary/90 text-primary-foreground px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
          <img
            src="/images/logo/logo.png"
            alt="The Good Habit"
            className="h-10 w-auto"
          />
        </div>
      </div>


        <h2 className="text-2xl font-bold text-center mb-2">Sign in</h2>
        <p className="text-center text-muted-foreground mb-6">
          Choose how you'd like to sign in
        </p>

        {/* GOOGLE BUTTON SAME */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const res = await useAuthStore
              .getState()
              .googleLogin(credentialResponse.credential);

            if (res.success) {
              toast.success("Logged in with Google");
              navigate("/profile");
            } else {
              toast.error(res.message);
            }
          }}
          onError={() => {
            toast.error("Google login failed");
          }}
        />
      </div>


        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-muted-foreground text-sm">or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {/* FORM — ONLY THIS PART CHANGED */}
        {step === "email" && (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full font-semibold py-3">
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        )}

        {/* OTP STEP */}
        {step === "otp" && (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter OTP"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-center text-xl tracking-widest focus:ring-2 focus:ring-primary focus:outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-semibold py-3"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <button
              type="button"
              disabled={loading}
              className="text-primary underline text-sm"
              onClick={handleSendOtp as any}
            >
              {loading ? "Resending..." : "Resend OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;
