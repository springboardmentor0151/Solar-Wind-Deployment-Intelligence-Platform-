import { HiOutlineExclamationTriangle } from "react-icons/hi2";

export default function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}) {
  return (
    <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <HiOutlineExclamationTriangle className="mx-auto text-4xl text-red-500 mb-4" />

      <p className="text-red-700 font-medium">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
