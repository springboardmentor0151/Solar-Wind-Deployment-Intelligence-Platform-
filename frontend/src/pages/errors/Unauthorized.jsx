import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Button from "../../components/ui/Button.jsx";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-warning-50 p-4">
        <ShieldAlert className="h-6 w-6 text-warning-500" />
      </div>
      <div>
        <p className="text-lg font-semibold text-ink">You don&apos;t have access to this page</p>
        <p className="mt-1 max-w-sm text-sm text-ink-faint">
          Your role doesn&apos;t include permission for this section. Contact an
          administrator if you believe this is a mistake.
        </p>
      </div>
      <Link to="/">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}
