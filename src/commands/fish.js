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
        { item: "🐟 Fish", baseChance: 14 },
        { item: "🦀 Crab", baseChance: 20 },
        { item: "🗑️ Trash", baseChance: 45 },
        { item: "🐠 Tropical Fish", baseChance: 8 },
        { item: "🪸 Coral", baseChance: 4 },
        { item: "🐡 Rare Fish", baseChance: 2 },
        { item: "🦑 Squid", baseChance: 1.5 },
        // Chests
        { item: "🟫 Common Chest", baseChance: 2 },      // 2%
        { item: "🟦 Rare Chest", baseChance: 1 },        // 1%
        { item: "🟨 Legendary Chest", baseChance: 0.5 }, // 0.5%
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

      // Normalize loot table so total chance is 100
      const totalChance = lootTable.reduce((sum, loot) => sum + loot.baseChance, 0);
      lootTable.forEach(loot => {
        loot.baseChance = (loot.baseChance / totalChance) * 100;
      });
      console.log("Normalized loot table:", lootTable);

      // Calculate total chance after buffs
      const adjustedTotalChance = lootTable.reduce((sum, loot) => sum + loot.baseChance, 0);
      console.log("Total loot table chance after buffs:", adjustedTotalChance);

      // Adjust chances based on rod and bait
      let numberOfItems = 1; // Default number of items
      if (user.rod === "Advanced Rod") numberOfItems = 3;
      if (user.rod === "Master Rod") numberOfItems = 5;

      console.log(`Number of items to catch: ${numberOfItems}`);

      // Chest rewards config
      const chestRewards = {
        "🟫 Common Chest": { min: 300, max: 700 },
        "🟦 Rare Chest": { min: 1000, max: 2000 },
        "🟨 Legendary Chest": { min: 3000, max: 10000 }
      };

      // Reset caughtItems for this interaction
      const caughtItems = [];
      let totalChestCoins = 0;
      let chestMessages = [];

      for (let i = 0; i < numberOfItems; i++) {
        const randomRoll = Math.random() * 100;
        let cumulativeChance = 0;

        for (const loot of lootTable) {
          cumulativeChance += loot.baseChance;
          if (randomRoll <= cumulativeChance) {
            caughtItems.push(loot.item);

            // If it's a chest, give coins instead of adding to inventory
            if (chestRewards[loot.item]) {
              const reward = Math.floor(
                Math.random() * (chestRewards[loot.item].max - chestRewards[loot.item].min + 1)
              ) + chestRewards[loot.item].min;
              user.coins += reward;
              totalChestCoins += reward;
              chestMessages.push(`You opened a ${loot.item} and found 💰 **${reward} coins**!`);
            } else {
              user.inventory.push(loot.item); // Add to user's inventory
            }
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
      updateUserData(userId, user);

      // Create an embed to display the newly caught items
      const embed = new EmbedBuilder()
        .setTitle(`🎣 Fishing Game - ${username}`)
        .setDescription(
          `Bait equipped: ${user.bait} (${user.baitCount} remaining)\nHere are the items you caught:`
        )
        .setColor("#00AAFF");

      for (const [item, count] of Object.entries(itemCounts)) {
        embed.addFields({ name: item, value: `x${count}`, inline: true });
      }

      // Add chest messages if any
      if (chestMessages.length > 0) {
        embed.addFields({ name: "Chests Opened", value: chestMessages.join("\n"), inline: false });
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

function simulateFishingRolls(rolls = 10000) {
  const lootTable = [
    { item: "🐟 Fish", baseChance: 15 },
    { item: "🦀 Crab", baseChance: 20 },
    { item: "🗑️ Trash", baseChance: 45 },
    { item: "🐠 Tropical Fish", baseChance: 8 },
    { item: "🪸 Coral", baseChance: 4 },
    { item: "🐡 Rare Fish", baseChance: 2 },
    { item: "🦑 Squid", baseChance: 1.5 },
    { item: "🟫 Common Chest", baseChance: 2 },
    { item: "🟦 Rare Chest", baseChance: 1 },
    { item: "🟨 Legendary Chest", baseChance: 0.5 }
  ];

  const chestRewards = {
    "🟫 Common Chest": { min: 300, max: 700 },
    "🟦 Rare Chest": { min: 1000, max: 2000 },
    "🟨 Legendary Chest": { min: 3000, max: 10000 }
  };

  const results = {};
  let totalChestCoins = 0;
  let chestCounts = { "🟫 Common Chest": 0, "🟦 Rare Chest": 0, "🟨 Legendary Chest": 0 };

  for (let i = 0; i < rolls; i++) {
    const randomRoll = Math.random() * 100;
    let cumulativeChance = 0;
    for (const loot of lootTable) {
      cumulativeChance += loot.baseChance;
      if (randomRoll <= cumulativeChance) {
        results[loot.item] = (results[loot.item] || 0) + 1;
        if (chestRewards[loot.item]) {
          chestCounts[loot.item]++;
          const reward = Math.floor(
            Math.random() * (chestRewards[loot.item].max - chestRewards[loot.item].min + 1)
          ) + chestRewards[loot.item].min;
          totalChestCoins += reward;
        }
        break;
      }
    }
  }

  console.log(`Simulated ${rolls} fishing rolls:`);
  Object.entries(results).forEach(([item, count]) => {
    console.log(`${item}: ${count} (${((count / rolls) * 100).toFixed(2)}%)`);
  });
  Object.entries(chestCounts).forEach(([chest, count]) => {
    if (count > 0) {
      console.log(`${chest} average coins: ${(totalChestCoins / count).toFixed(2)}`);
    }
  });
  console.log(`Total coins from chests: ${totalChestCoins}`);
}

// Run the simulation
simulateFishingRolls(10000);