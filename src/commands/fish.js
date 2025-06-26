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

      // Ensure inventory is an array
      if (!Array.isArray(user.inventory)) user.inventory = [];

      // Define fishing items and their base probabilities
      const lootTable = [
        { item: "🐟 Fish", baseChance: 15 }, // 50% chance
        { item: "🦀 Crab", baseChance: 20 }, // 20% chance
        { item: "🗑️ Trash", baseChance: 50 }, // 15% chance
        { item: "🐠 Tropical Fish", baseChance: 10 }, // 10% chance
        { item: "🪸 Coral", baseChance: 5 }, // 5% chance
        { item: "🐡 Rare Fish", baseChance: 3 }, // 3% chance
        { item: "🦑 Squid", baseChance: 2 }, // 2% chance
      ];

      // Adjust probabilities based on rod and bait
      lootTable.forEach((loot) => {
        if (user.rod === "Better Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral"].includes(loot.item)) loot.baseChance += 5; // Increase chance for better items
        }
        if (user.rod === "Advanced Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral", "🐡 Rare Fish"].includes(loot.item)) loot.baseChance += 10; // Increase chance for rare items
        }
        if (user.rod === "Master Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral", "🐡 Rare Fish", "🦑 Squid"].includes(loot.item)) loot.baseChance += 15; // Significantly increase chance for rare items
        }
      });

      if (user.baitCount > 0) {
        console.log(`Applying bait buff: ${user.bait} (${user.baitCount} remaining)`);

        // Apply bait buffs
        lootTable.forEach((loot) => {
          if (user.bait === "Premium Bait" && ["🐡 Rare Fish", "🦑 Squid"].includes(loot.item)) {
            loot.baseChance += 5;
          }
          if (user.bait === "Golden Bait" && ["🐡 Rare Fish", "🦑 Squid"].includes(loot.item)) {
            loot.baseChance += 10;
          }
          if (user.bait === "Legendary Bait" && ["🐡 Rare Fish", "🦑 Squid"].includes(loot.item)) {
            loot.baseChance += 15;
          }
        });

        // Decrease bait count
        user.baitCount -= 1;
        if (user.baitCount === 0) {
          user.bait = "None"; // Reset bait when count reaches zero
        }
        updateUserData(userId, user);
      } else {
        console.log("No bait equipped.");
      }

      console.log("Adjusted loot table:", lootTable);

      // Adjust chances based on rod and bait
      let numberOfItems = 1; // Default number of items
      if (user.rod === "Advanced Rod") numberOfItems = 3;
      if (user.rod === "Master Rod") numberOfItems = 5;

      console.log(`Number of items to catch: ${numberOfItems}`);

      // Reset caughtItems for this interaction
      const caughtItems = [];
      for (let i = 0; i < numberOfItems; i++) {
        const randomRoll = Math.random() * 100; // Generate a random number between 0 and 100
        let cumulativeChance = 0;

        for (const loot of lootTable) {
          cumulativeChance += loot.baseChance;
          if (randomRoll <= cumulativeChance) {
            caughtItems.push(loot.item);
            user.inventory.push(loot.item); // Add to user's inventory
            break;
          }
        }
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
        .setDescription(`Bait equipped: ${user.bait} (${user.baitCount} remaining)\nHere are the items you caught:`)
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