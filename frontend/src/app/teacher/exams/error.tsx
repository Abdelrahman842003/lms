'use client';

import { useEffect } from 'react';
import { Icon, Button } from '@/components/ui';

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
        <Icon name="exclamation-circle" size="2x" className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">حدث خطأ ما!</h2>
        <p className="text-gray-400 mb-6">
          عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <Button
          variant="primary"
          onClick={() => reset()}
        >
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}
