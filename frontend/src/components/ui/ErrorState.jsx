import { AlertTriangle } from "lucide-react";
import Button from "./Button.jsx";
import { extractErrorMessage } from "../../api/axiosClient.js";

export default function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-danger-500/20 bg-danger-50 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-danger-500" />
      <div>
        <p className="text-sm font-semibold text-danger-700">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-danger-700/80">
          {extractErrorMessage(error)}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
