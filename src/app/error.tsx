"use client"; // required for error.tsx

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600">500 - Internal Server Error</h1>
      <p className="mt-2 text-gray-600">
        Something went wrong. Please try again later.
      </p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-black text-white rounded-md"
      >
        Try Again
      </button>
    </div>
  );
}
