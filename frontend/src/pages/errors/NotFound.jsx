import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";
import Button from "../../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-surface-muted p-4">
        <CompassIcon className="h-6 w-6 text-ink-faint" />
      </div>
      <div>
        <p className="text-lg font-semibold text-ink">Page not found</p>
        <p className="mt-1 text-sm text-ink-faint">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
      </div>
      <Link to="/">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}
