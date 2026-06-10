-- Minnie XP Bot - SQLite Schema
-- Designed for easy PostgreSQL migration (standard types, explicit IDs)

PRAGMA foreign_keys = ON;

-- Per-guild configuration
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  voice_xp_rate REAL NOT NULL DEFAULT 5,
  text_xp_min INTEGER NOT NULL DEFAULT 5,
  text_xp_max INTEGER NOT NULL DEFAULT 10,
  text_cooldown INTEGER NOT NULL DEFAULT 60,
  daily_xp_cap INTEGER NOT NULL DEFAULT 500,
  min_message_length INTEGER NOT NULL DEFAULT 3,
  max_level INTEGER NOT NULL DEFAULT 100,
  prestige_max INTEGER NOT NULL DEFAULT 10,
  log_channel_id TEXT,
  level_up_channel_id TEXT,
  prestige_role_id TEXT,
  coin_voice_rate REAL NOT NULL DEFAULT 0.1,
  coin_text_rate REAL NOT NULL DEFAULT 0.1,
  prestige_xp_multiplier REAL NOT NULL DEFAULT 1.1,
  prestige_coin_multiplier REAL NOT NULL DEFAULT 1.1,
  anti_spam_window INTEGER NOT NULL DEFAULT 10,
  anti_spam_max_messages INTEGER NOT NULL DEFAULT 5,
  voice_afk_threshold_minutes INTEGER NOT NULL DEFAULT 120,
  dashboard_url TEXT,
  dashboard_link_text TEXT,
  dashboard_embed_title TEXT,
  dashboard_embed_description TEXT,
  dashboard_min_role_id TEXT,
  dashboard_allowed_role_ids TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User progression per guild
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT 'Unknown',
  total_xp INTEGER NOT NULL DEFAULT 0,
  voice_xp INTEGER NOT NULL DEFAULT 0,
  text_xp INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  seasonal_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  voice_time_seconds INTEGER NOT NULL DEFAULT 0,
  daily_xp_earned INTEGER NOT NULL DEFAULT 0,
  daily_xp_reset_date TEXT,
  last_activity TEXT,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_streak_date TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, guild_id)
);

CREATE INDEX IF NOT EXISTS idx_users_guild_total ON users(guild_id, total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild_weekly ON users(guild_id, weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild_seasonal ON users(guild_id, seasonal_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild_voice ON users(guild_id, voice_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_guild_text ON users(guild_id, text_xp DESC);

-- Level-based role rewards
CREATE TABLE IF NOT EXISTS level_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  role_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, level)
);

-- Voice session tracking
CREATE TABLE IF NOT EXISTS voice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  left_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  is_valid INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id, guild_id);

-- Channel XP rules (whitelist/blacklist/bonus)
CREATE TABLE IF NOT EXISTS channel_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('whitelist', 'blacklist')),
  applies_to TEXT NOT NULL DEFAULT 'both' CHECK(applies_to IN ('voice', 'text', 'both')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, channel_id, rule_type)
);

CREATE TABLE IF NOT EXISTS category_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('whitelist', 'blacklist')),
  applies_to TEXT NOT NULL CHECK(applies_to IN ('voice', 'text')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, category_id, rule_type, applies_to)
);

CREATE TABLE IF NOT EXISTS bonus_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  multiplier REAL NOT NULL DEFAULT 1.5,
  applies_to TEXT NOT NULL DEFAULT 'both' CHECK(applies_to IN ('voice', 'text', 'both')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, channel_id)
);

-- XP and economy logs
CREATE TABLE IF NOT EXISTS xp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('voice', 'text', 'admin', 'quest', 'streak', 'event')),
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS text_xp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  channel_id TEXT,
  message_id TEXT,
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suspicious_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Role shop
CREATE TABLE IF NOT EXISTS shop_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  cost INTEGER NOT NULL,
  name TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, role_id)
);

CREATE TABLE IF NOT EXISTS shop_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  cost INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quests
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  quest_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  is_daily INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, quest_key)
);

CREATE TABLE IF NOT EXISTS quest_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  quest_id INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  quest_date TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE(user_id, guild_id, quest_id, quest_date)
);

-- Seasonal snapshots
CREATE TABLE IF NOT EXISTS seasonal_leaderboards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  season_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT,
  total_xp INTEGER NOT NULL,
  rank INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(guild_id, season_key, user_id)
);

-- Text cooldown & spam tracking (in-memory cache backed by optional table)
CREATE TABLE IF NOT EXISTS user_text_state (
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  last_message_hash TEXT,
  last_xp_at TEXT,
  recent_messages TEXT,
  PRIMARY KEY (user_id, guild_id)
);
