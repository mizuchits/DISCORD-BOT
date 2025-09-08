const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUserData, updateUserData } = require("../data/userData");

function getXpForLevel(level) {
  return 100 + (level - 1) * 50;
}

const xpValues = {
  "🐟 Fish": 10,
  "🦀 Crab": 12,
  "🗑️ Trash": 2,
  "🐠 Tropical Fish": 20,
  "🪸 Coral": 15,
  "🐡 Rare Fish": 30,
  "🦑 Squid": 25,
  "🟫 Common Chest": 40,
  "🟦 Rare Chest": 80,
  "🟨 Legendary Chest": 200
};

const chestRewards = {
  "🟫 Common Chest": { min: 300, max: 700 },
  "🟦 Rare Chest": { min: 1000, max: 2000 },
  "🟨 Legendary Chest": { min: 3000, max: 10000 }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("Go fishing and collect random items!"),
  async execute(interaction) {
    try {
      console.log("Executing /fish command...");

      
      if (interaction.deferred || interaction.replied) {
        console.error("Interaction already acknowledged.");
        return;
      }

      
      await interaction.deferReply();

      const userId = interaction.user.id;
      const username = interaction.user.username; 

      
      console.log(`Fetching user data for userId: ${userId}`);
      const user = getUserData(userId);
      console.log("User data:", user);

      
      if (!Array.isArray(user.inventory)) user.inventory = [];

      // Ensure xp and level are set
      if (typeof user.xp !== "number") user.xp = 0;
      if (typeof user.level !== "number") user.level = 1;

      
      const lootTable = [
        { item: "🐟 Fish", baseChance: 14 },
        { item: "🦀 Crab", baseChance: 20 },
        { item: "🗑️ Trash", baseChance: 45 },
        { item: "🐠 Tropical Fish", baseChance: 8 },
        { item: "🪸 Coral", baseChance: 4 },
        { item: "🐡 Rare Fish", baseChance: 2 },
        { item: "🦑 Squid", baseChance: 1.5 },
        
        { item: "🟫 Common Chest", baseChance: 2 },      // 2%
        { item: "🟦 Rare Chest", baseChance: 1 },        // 1%
        { item: "🟨 Legendary Chest", baseChance: 0.5 }, // 0.5%
      ];

      
      lootTable.forEach((loot) => {
        if (user.rod === "Better Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral"].includes(loot.item)) loot.baseChance += 5; 
        }
        if (user.rod === "Advanced Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral", "🐡 Rare Fish"].includes(loot.item)) loot.baseChance += 10; 
        }
        if (user.rod === "Master Rod") {
          if (["🐠 Tropical Fish", "🪸 Coral", "🐡 Rare Fish", "🦑 Squid"].includes(loot.item)) loot.baseChance += 15; 
        }
      });

      const baitNames = { premium: "Premium Bait", golden: "Golden Bait", legendary: "Legendary Bait" };
      const equippedType = user.baitEquipped;
      const equippedName = equippedType ? baitNames[equippedType] : "None";
      const equippedCount = equippedType ? (user.baitCounts?.[equippedType] || 0) : 0;
      const baitLine = `Bait equipped: ${equippedName}${equippedType ? ` (${equippedCount} remaining)` : ""}`;

      if (user.baitCount > 0) {
        console.log(`Applying bait buff: ${user.bait} (${user.baitCount} remaining)`);

        
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

        
        user.baitCount -= 1;
        if (user.baitCount === 0) {
          user.bait = "None"; 
        }
        updateUserData(userId, user);
      } else {
        console.log("No bait equipped.");
      }

      console.log("Adjusted loot table:", lootTable);

      
      const totalChance = lootTable.reduce((sum, loot) => sum + loot.baseChance, 0);
      lootTable.forEach(loot => {
        loot.baseChance = (loot.baseChance / totalChance) * 100;
      });
      console.log("Normalized loot table:", lootTable);

      
      const adjustedTotalChance = lootTable.reduce((sum, loot) => sum + loot.baseChance, 0);
      console.log("Total loot table chance after buffs:", adjustedTotalChance);

      
      let numberOfItems = 1; 
      if (user.rod === "Advanced Rod") numberOfItems = 3;
      if (user.rod === "Master Rod") numberOfItems = 5;

      console.log(`Number of items to catch: ${numberOfItems}`);

      
      const caughtItems = [];
      let totalChestCoins = 0;
      let chestMessages = [];
      let gainedXp = 0;

      for (let i = 0; i < numberOfItems; i++) {
        const randomRoll = Math.random() * 100;
        let cumulativeChance = 0;

        for (const loot of lootTable) {
          cumulativeChance += loot.baseChance;
          if (randomRoll <= cumulativeChance) {
            caughtItems.push(loot.item);
            gainedXp += xpValues[loot.item] || 0;

            
            if (chestRewards[loot.item]) {
              const reward = Math.floor(
                Math.random() * (chestRewards[loot.item].max - chestRewards[loot.item].min + 1)
              ) + chestRewards[loot.item].min;
              user.coins += reward;
              totalChestCoins += reward;
              chestMessages.push(`You opened a ${loot.item} and found 💰 **${reward} coins**!`);
            } else {
              user.inventory.push(loot.item); 
            }
            break;
          }
        }
      }

      console.log("Caught items:", caughtItems);

      
      const itemCounts = {};
      caughtItems.forEach((item) => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });

      console.log("Item counts:", itemCounts);

      
      user.xp += gainedXp;
      let leveledUp = false;
      while (user.xp >= getXpForLevel(user.level)) {
        user.xp -= getXpForLevel(user.level);
        user.level += 1;
        leveledUp = true;
      }
      updateUserData(userId, user);

      
      const embed = new EmbedBuilder()
        .setTitle(`🎣 Fishing Game - ${username}`)
        .setDescription(
          `${baitLine}\nHere are the items you caught:`
        )
        .setColor("#00AAFF");

      for (const [item, count] of Object.entries(itemCounts)) {
        embed.addFields({ name: item, value: `x${count}`, inline: true });
      }

      
      if (chestMessages.length > 0) {
        embed.addFields({ name: "Chests Opened", value: chestMessages.join("\n"), inline: false });
      }
      embed.addFields({ name: "XP Gained", value: `+${gainedXp} XP`, inline: true });
      if (leveledUp) {
        embed.addFields({ name: "Level Up!", value: `🎉 You reached level ${user.level}!`, inline: false });
      }
      embed.setFooter({ text: `Level: ${user.level} | XP: ${user.xp}/${getXpForLevel(user.level)}` });

      
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


simulateFishingRolls(10000);