const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserData, updateUserData } = require("../data/userData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell all items in your inventory for coins."),
  async execute(interaction) {
    const userId = interaction.user.id;

    
    const user = getUserData(userId);

    if (user.inventory.length === 0) {
      await interaction.reply({ content: "🧺 Your inventory is empty. Go fishing with `/fish`!", ephemeral: true });
      return;
    }

    
    const itemCounts = {};
    user.inventory.forEach((item) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    
    const earnings = user.inventory.length * 10;

    // Reset inventory
    user.inventory = [];
    user.coins += earnings;

    
    updateUserData(userId, user);

    
    const embed = new EmbedBuilder()
      .setTitle("💰 Items Sold")
      .setDescription("You sold the following items:")
      .setColor("#FFD700");

    for (const [item, count] of Object.entries(itemCounts)) {
      embed.addFields({ name: item, value: `x${count}`, inline: true });
    }

    embed.addFields({ name: "Total Earnings", value: `**${earnings} coins**`, inline: false });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};