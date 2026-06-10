"use client";

import { useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const BackButton = () => {
  const router = useRouter();
  const handleBack = useCallback(() => {
    startTransition(() => {
      router.back();
    });
  }, [router]);
  return (
    <button
      onClick={handleBack}
      className="blog-control pointer-events-auto h-10 w-10 p-0"
      title="返回列表"
    >
      <ArrowLeft size={20} />
    </button>
  );
};
