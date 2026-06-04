import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getMe, getLoginUrl } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then(() => router.push('/dashboard'))
      .catch(async () => {
        try {
          const { url } = await getLoginUrl();
          window.location.href = url;
        } catch {
          router.push('/login');
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
