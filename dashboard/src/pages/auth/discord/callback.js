function getBackendUrl() {
  return process.env.API_BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:4000';
}

export async function getServerSideProps({ query }) {
  const { code, error: oauthError } = query;

  if (oauthError) {
    return {
      redirect: { destination: `/login?error=${encodeURIComponent(String(oauthError))}`, permanent: false },
    };
  }

  if (!code) {
    return {
      redirect: { destination: '/login?error=missing_code', permanent: false },
    };
  }

  const backend = getBackendUrl();

  try {
    const r = await fetch(`${backend}/api/auth/exchange?code=${encodeURIComponent(String(code))}`);
    const data = await r.json();

    if (!r.ok || !data.token) {
      const msg = data.error || 'OAuth failed — is the API running (npm start)?';
      return {
        redirect: { destination: `/login?error=${encodeURIComponent(msg)}`, permanent: false },
      };
    }

    return {
      redirect: {
        destination: `/auth/complete?token=${encodeURIComponent(data.token)}`,
        permanent: false,
      },
    };
  } catch {
    return {
      redirect: {
        destination: '/login?error=' + encodeURIComponent('Cannot reach API on port 4000. Run npm start.'),
        permanent: false,
      },
    };
  }
}

export default function DiscordCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <p className="text-gray-400">Signing you in...</p>
    </div>
  );
}
