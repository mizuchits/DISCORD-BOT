const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, updateUserData } = require('../data/userData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buybait')
    .setDescription('Buy baits in any quantity!')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of bait')
        .setRequired(true)
        .addChoices(
          { name: 'Premium Bait', value: 'premium' },
          { name: 'Golden Bait', value: 'golden' },
          { name: 'Legendary Bait', value: 'legendary' }
        )
    ),
  async execute(interaction) {
    const baitType = interaction.options.getString('type');
    const baitLabels = {
      premium: "Premium Bait",
      golden: "Golden Bait",
      legendary: "Legendary Bait"
    };
    const baitPrices = { premium: 30, golden: 150, legendary: 400 };
    const quantities = [1, 5, 10, 20, 100];
    const row = new ActionRowBuilder().addComponents(
      ...quantities.map(q =>
        new ButtonBuilder()
          .setCustomId(`buybait_${baitType}_${q}`)
          .setLabel(`Buy ${q}`)
          .setStyle(ButtonStyle.Primary)
      )
    );
    await interaction.reply({
      content: `How many ${baitLabels[baitType]}s would you like to buy?`,
      components: [row],
      flags: 64 // ephemeral
    });
  },
  async handleButtonInteraction(interaction) {
    if (interaction.customId.startsWith("buybait_")) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const [ , baitType, quantityStr ] = interaction.customId.split("_");
      const quantity = parseInt(quantityStr);

      const baitPrices = { premium: 30, golden: 150, legendary: 400 };
      const baitNames = { premium: "Premium Bait", golden: "Golden Bait", legendary: "Legendary Bait" };

      const baitPrice = baitPrices[baitType];
      const baitName = baitNames[baitType];
      const cost = baitPrice * quantity;

      const userId = interaction.user.id;
      const user = getUserData(userId);

      // Ensure baitCounts exists
      if (!user.baitCounts) user.baitCounts = { premium: 0, golden: 0, legendary: 0 };

      if (user.coins >= cost) {
        user.coins -= cost;
        user.baitCounts[baitType] += quantity;
        // ❌ Do NOT add bait to inventory!
        updateUserData(userId, user);

        await interaction.editReply({
          content: `✅ You purchased ${quantity} ${baitName}(s) for ${cost} coins! You now have ${user.baitCounts[baitType]} ${baitName}(s).`
        });
      } else {
        await interaction.editReply({
          content: `❌ You don't have enough coins to buy ${quantity} ${baitName}(s). You need ${cost} coins.`
        });
      }
      return;
    }
  }
};