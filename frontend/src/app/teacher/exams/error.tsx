'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
      <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md">
        <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
        <h2 className="text-xl font-bold text-white mb-2">حدث خطأ ما!</h2>
        <p className="text-gray-400 mb-6">
          عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
