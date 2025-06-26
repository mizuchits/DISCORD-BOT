const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUserData } = require("../data/userData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory and equip bait!"),
  async execute(interaction) {
    const userId = interaction.user.id;

    // Get user data
    const user = getUserData(userId);

    // Show bait counts
    const baitCounts = user.baitCounts || { premium: 0, golden: 0, legendary: 0 };
    const baitNames = { premium: "Premium Bait", golden: "Golden Bait", legendary: "Legendary Bait" };

    let desc = `**Your Baits:**\n`;
    for (const type of ["premium", "golden", "legendary"]) {
      desc += `- ${baitNames[type]}: ${baitCounts[type] || 0}\n`;
    }
    desc += `\n**Equipped Bait:** ${user.baitEquipped ? baitNames[user.baitEquipped] : "None"}`;

    // Bait selection buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("selectbait_premium").setLabel("Equip Premium").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("selectbait_golden").setLabel("Equip Golden").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("selectbait_legendary").setLabel("Equip Legendary").setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: desc,
      components: [row],
      flags: 64, // ephemeral
    });
  },
};