const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const QuestService = require('../services/QuestService');

module.exports = {
  data: new SlashCommandBuilder().setName('quests').setDescription('View your daily quests'),
  async execute(interaction) {
    const quests = QuestService.getQuestsForUser(interaction.user.id, interaction.guild.id);
    const embed = new EmbedBuilder().setTitle('Daily Quests').setColor(0xeb459e);
    embed.setDescription(
      quests.map((q) => {
        const status = q.claimed ? '✅ Claimed' : q.completed ? '🎁 Ready' : `⏳ ${q.progress}/${q.target_value}`;
        return `**${q.title}** — ${status}\n↳ Reward: ${q.reward_xp} XP, ${q.reward_coins} coins`;
      }).join('\n\n') || 'No quests configured.'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
