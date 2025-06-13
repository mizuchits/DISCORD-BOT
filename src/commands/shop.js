const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const userData = require("../data/userData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View the shop and buy items."),
  async execute(interaction) {
    const userId = interaction.user.id;

    // Initialize user data if not present
    if (!userData[userId]) {
      userData[userId] = { inventory: [], coins: 100, rod: "Basic Rod", bait: "None" };
    }

    // Create the main shop embed
    const shopEmbed = new EmbedBuilder()
      .setTitle("🛒 Fishing Shop")
      .setDescription("Choose a category to view items:")
      .setColor("#FFD700");

    // Create buttons for Rods and Baits
    const shopRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("view_rods").setLabel("View Rods").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("view_baits").setLabel("View Baits").setStyle(ButtonStyle.Secondary)
    );

    // Send the main shop embed with buttons
    await interaction.reply({ embeds: [shopEmbed], components: [shopRow] });
  },
};