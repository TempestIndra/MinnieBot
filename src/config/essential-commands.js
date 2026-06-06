/**
 * Slash commands registered on `npm run deploy-commands`.
 * User commands only — all server config is done via the web dashboard (admins).
 *
 * Set DEPLOY_ALL_COMMANDS=true in .env to deploy every command in src/commands/.
 * Set DEPLOY_COMMANDS=... in .env to override this list.
 *
 * ─── USER (deployed) ──────────────────────────────────────────
 *   profile, rank, leaderboard, prestige, balance, shop, buy,
 *   quests, claimquest, dashboard (admin-only in Discord)
 *
 * ─── NOT DEPLOYED (use web dashboard instead) ───────────────
 *   All set*, add*, remove*, reset*, force*, whitelist*, blacklist*, etc.
 * ─────────────────────────────────────────────────────────────
 */

module.exports = [
  'profile',
  'rank',
  'leaderboard',
  'prestige',
  'balance',
  'shop',
  'buy',
  'quests',
  'claimquest',
  'dashboard', // Administrator permission required
];
