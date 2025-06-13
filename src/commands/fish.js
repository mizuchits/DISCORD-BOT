const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUserData, updateUserData } = require("../data/userData");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("Go fishing and collect random items!"),
  async execute(interaction) {
    try {
      console.log("Executing /fish command...");

      // Check if the interaction has already been acknowledged
      if (interaction.deferred || interaction.replied) {
        console.error("Interaction already acknowledged.");
        return;
      }

      // Acknowledge the interaction immediately
      await interaction.deferReply();

      const userId = interaction.user.id;
      const username = interaction.user.username; // Get the username of the user

      // Get user data
      console.log(`Fetching user data for userId: ${userId}`);
      const user = getUserData(userId);
      console.log("User data:", user);

      // Define fishing items based on rod and bait
      const basicItems = ["🐟 Fish", "🦀 Crab", "🗑️ Trash"];
      const betterRodItems = ["🐠 Tropical Fish", "🪸 Coral"];
      const premiumBaitItems = ["🐡 Rare Fish", "🦑 Squid"];

      let fishingItems = [...basicItems];
      if (user.rod === "Better Rod" || user.rod === "Advanced Rod") fishingItems.push(...betterRodItems);
      if (user.bait === "Premium Bait" || user.bait === "Golden Bait") fishingItems.push(...premiumBaitItems);

      console.log("Fishing items:", fishingItems);

      // Adjust chances based on rod and bait
      let numberOfItems = 1; // Default number of items
      if (user.rod === "Advanced Rod") numberOfItems = 3;
      if (user.rod === "Master Rod") numberOfItems = 5;

      console.log(`Number of items to catch: ${numberOfItems}`);

      // Reset caughtItems for this interaction
      const caughtItems = [];
      for (let i = 0; i < numberOfItems; i++) {
        const randomItem = fishingItems[Math.floor(Math.random() * fishingItems.length)];
        caughtItems.push(randomItem);
        user.inventory.push(randomItem); // Add to user's inventory
      }

      console.log("Caught items:", caughtItems);

      // Count each type of newly caught item
      const itemCounts = {};
      caughtItems.forEach((item) => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });

      console.log("Item counts:", itemCounts);

      // Update user data
      console.log("Updating user data...");
      updateUserData(userId, user);

      // Create an embed to display the newly caught items
      const embed = new EmbedBuilder()
        .setTitle(`🎣 Fishing Game - ${username}`)
        .setDescription("Here are the items you caught:")
        .setColor("#00AAFF");

      for (const [item, count] of Object.entries(itemCounts)) {
        embed.addFields({ name: item, value: `x${count}`, inline: true });
      }

      // Create buttons for further actions
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("fish_again").setLabel("🎣 Fish Again").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("view_inventory").setLabel("🧺 Inventory").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("sell_items").setLabel("💰 Sell").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("shop").setLabel("🛒 Shop").setStyle(ButtonStyle.Secondary)
      );

      console.log("Sending response...");
      await interaction.editReply({ embeds: [embed], components: [row] });
      console.log("Response sent successfully.");
    } catch (error) {
      console.error("Error in /fish command:", error);
    }
  },
};