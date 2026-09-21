import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { MailX, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type State = "confirm" | "done" | "resubscribed" | "invalid";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [state, setState] = useState<State>(token ? "confirm" : "invalid");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (path: string, next: State) => {
    setBusy(true);
    try {
      const { data } = await api.post(path, { token });
      if (!data?.success) {
        setState("invalid");
        return;
      }
      setEmail(data.email || "");
      setState(next);
    } catch {
      setState("invalid");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 px-4 py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        {state === "confirm" && (
          <>
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <MailX className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-primary">
              Unsubscribe from our newsletter?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll stop receiving product news and offers. Order and delivery
              emails aren't affected.
            </p>
            <Button
              className="mt-6 w-full rounded-full"
              disabled={busy}
              onClick={() => call("/newsletter/unsubscribe/token", "done")}
            >
              {busy ? "Unsubscribing..." : "Yes, unsubscribe me"}
            </Button>
            <Link
              to="/"
              className="mt-3 inline-block text-sm text-muted-foreground hover:text-primary"
            >
              No, keep me subscribed
            </Link>
          </>
        )}

        {state === "done" && (
          <>
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-primary">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {email ? <>We won't email {email} about news or offers again.</> : "We won't send you any more newsletters."}
              {" "}Order and delivery emails are unaffected.
            </p>
            <Button
              variant="outline"
              className="mt-6 w-full rounded-full gap-2"
              disabled={busy}
              onClick={() => call("/newsletter/resubscribe/token", "resubscribed")}
            >
              <Undo2 className="h-4 w-4" />
              {busy ? "Working..." : "Undo — resubscribe me"}
            </Button>
            <Link
              to="/"
              className="mt-3 inline-block text-sm text-muted-foreground hover:text-primary"
            >
              Back to the shop
            </Link>
          </>
        )}

        {state === "resubscribed" && (
          <>
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Check className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-primary">You're back on the list</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {email || "You"} will keep receiving our newsletter.
            </p>
            <Link to="/">
              <Button className="mt-6 w-full rounded-full">Back to the shop</Button>
            </Link>
          </>
        )}

        {state === "invalid" && (
          <>
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <MailX className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-primary">This link isn't valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have already been used or expired. You can still unsubscribe
              from the form in our site footer.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-6 w-full rounded-full">
                Back to the shop
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
