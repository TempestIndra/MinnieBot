export default function NoBotServers({ inviteUrl }) {
  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-4">No servers available</h2>
      <p className="text-gray-400 mb-4">
        The dashboard lists servers where you have <strong>Administrator</strong>, a{' '}
        <strong>configured dashboard role</strong>, or <strong>developer access</strong>, and where the{' '}
        <strong>Minnie bot is installed</strong>.
      </p>
      {inviteUrl ? (
        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-discord hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition"
        >
          Invite Minnie to a server
        </a>
      ) : (
        <p className="text-gray-500 text-sm">Start the bot with <code>npm start</code> to get an invite link.</p>
      )}
    </div>
  );
}
