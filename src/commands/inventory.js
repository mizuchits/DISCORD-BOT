const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserData } = require("../data/userData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory."),
  async execute(interaction) {
    const userId = interaction.user.id;

    // Get user data
    const user = getUserData(userId);

    if (user.inventory.length === 0) {
      await interaction.reply({ content: "🧺 Your inventory is empty. Go fishing with `/fish`!", ephemeral: true });
      return;
    }

    // Count items in the inventory
    const itemCounts = {};
    user.inventory.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    // Create an embed to display the inventory
    const embed = new EmbedBuilder()
      .setTitle("🧺 Your Fishing Inventory")
      .setColor("#00AAFF")
      .setDescription("Here is what you've caught so far:");

    for (const [item, count] of Object.entries(itemCounts)) {
      embed.addFields({ name: item, value: `x${count}`, inline: true });
    }

    embed.addFields({ name: "💰 Coins", value: `${user.coins} coins`, inline: false });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};