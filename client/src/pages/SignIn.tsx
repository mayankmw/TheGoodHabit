import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const SignIn = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/20 px-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-md p-8 animate-fadeIn">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/images/logo/logo.png" alt="Logo" className="h-10" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-center mb-2">Sign in</h2>
        <p className="text-center text-muted-foreground mb-6">
          Choose how you'd like to sign in
        </p>

        {/* Google Sign In */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition"
        >
          <FcGoogle size={22} />
          <span className="font-medium">Sign in with Google</span>
        </Button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-muted-foreground text-sm">or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {/* Email Input */}
        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3">
            Continue
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <Link to="#" className="hover:text-primary transition">
          Privacy policy
        </Link>
        <Link to="#" className="hover:text-primary transition">
          Terms of service
        </Link>
      </div>
    </div>
  );
};

export default SignIn;
