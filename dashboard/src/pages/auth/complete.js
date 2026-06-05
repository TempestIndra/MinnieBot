import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthComplete() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { token, error } = router.query;

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (token) {
      sessionStorage.setItem('minnie_token', String(token));
      router.replace('/dashboard');
      return;
    }

    router.replace('/login?error=missing_token');
  }, [router.isReady, router.query, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <p className="text-gray-400">Signing you in...</p>
    </div>
  );
}
