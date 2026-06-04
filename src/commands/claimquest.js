const { SlashCommandBuilder } = require('discord.js');
const QuestService = require('../services/QuestService');
const QuestRepository = require('../repositories/QuestRepository');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claimquest')
    .setDescription('Claim a completed daily quest')
    .addStringOption((o) =>
      o.setName('quest')
        .setDescription('Quest key')
        .setRequired(true)
        .setAutocomplete(true)),
  async execute(interaction) {
    const key = interaction.options.getString('quest');
    const quests = QuestRepository.getDailyQuests(interaction.guild.id);
    const q = quests.find((x) => x.quest_key === key);
    if (!q) return interaction.reply({ content: 'Quest not found.', ephemeral: true });
    const result = QuestService.claimQuest(interaction.user.id, interaction.guild.id, q.id);
    if (!result.ok) return interaction.reply({ content: `Cannot claim: ${result.reason}`, ephemeral: true });
    await interaction.reply({ content: `🎉 Claimed **${q.title}**! +${result.rewards.xp} XP, +${result.rewards.coins} coins.` });
  },
  async autocomplete(interaction) {
    const quests = QuestRepository.getDailyQuests(interaction.guild.id);
    const focused = interaction.options.getFocused();
    const filtered = quests.filter((q) => q.quest_key.includes(focused) || q.title.toLowerCase().includes(focused.toLowerCase()));
    await interaction.respond(filtered.slice(0, 25).map((q) => ({ name: q.title, value: q.quest_key })));
  },
};
