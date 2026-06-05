import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getMe } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then(() => router.replace('/dashboard'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
