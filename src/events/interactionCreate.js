const logger = require("@turkerssh/logger");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { getUserData, updateUserData } = require("../data/userData");

const cooldowns = new Map();

module.exports = (client) => {
  console.log("Registering interactionCreate listener...");
  
  // Listener for slash commands
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (cooldowns.has(interaction.user.id)) {
      const remainingTime = cooldowns.get(interaction.user.id) - Date.now();
      if (remainingTime > 0) {
        await interaction.reply({ content: `Please wait ${Math.ceil(remainingTime / 1000)} seconds before using this command again.`, ephemeral: true });
        return;
      }
    }

    cooldowns.set(interaction.user.id, Date.now() + 5000); // 5-second cooldown

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "Command not found!", ephemeral: true });
      return;
    }

    try {
      logger.debug({
        type: "interaction",
        message: `${interaction.user.tag} executed ${interaction.commandName} command`,
      });
      await command.execute(interaction);
    } catch (error) {
      logger.error({
        type: "interaction",
        message: error,
      });
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  // Listener for modal submissions
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "textInputModal") {
        const userInput = interaction.fields.getTextInputValue("userMessage");

        // Defer the reply and delete it (optional)
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        // Send the user's input to the same channel
        await interaction.channel.send(userInput);
      }
    }
  });

  // Listener for button interactions
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isButton()) {
        console.log(`Button clicked: ${interaction.customId}`); // Log the button ID

        const userId = interaction.user.id;
        const user = getUserData(userId);

        switch (interaction.customId) {
          case "fish_again":
            const fishCommand = client.commands.get("fish");
            if (fishCommand) {
              await fishCommand.execute(interaction); // Do not defer the reply again
            } else {
              await interaction.reply({ content: "❌ The Fish command is not available.", flags: MessageFlags.Ephemeral });
            }
            break;

          case "view_inventory":
            const inventoryCommand = client.commands.get("inventory");
            if (inventoryCommand) {
              await inventoryCommand.execute(interaction);
            } else {
              await interaction.reply({ content: "❌ The Inventory command is not available.", flags: MessageFlags.Ephemeral });
            }
            break;

          case "sell_items":
            if (user.inventory.length === 0) {
              await interaction.reply({ content: "🧺 Your inventory is empty. Go fishing with `/fish`!", flags: MessageFlags.Ephemeral });
              return;
            }

            // Count items in the inventory
            const itemCounts = {};
            user.inventory.forEach((item) => {
              itemCounts[item] = (itemCounts[item] || 0) + 1;
            });

            // Calculate earnings (e.g., 10 coins per item)
            const earnings = user.inventory.length * 10;

            // Reset inventory
            user.inventory = [];
            user.coins += earnings;

            // Update user data
            updateUserData(userId, user);

            // Create an embed to display the sold items and earnings
            const embed = new EmbedBuilder()
              .setTitle("💰 Items Sold")
              .setDescription("You sold the following items:")
              .setColor("#FFD700");

            for (const [item, count] of Object.entries(itemCounts)) {
              embed.addFields({ name: item, value: `x${count}`, inline: true });
            }

            embed.addFields({ name: "Total Earnings", value: `**${earnings} coins**`, inline: false });

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            break;

          case "shop":
            const shopCommand = client.commands.get("shop");
            if (shopCommand) {
              await shopCommand.execute(interaction);
            } else {
              await interaction.reply({ content: "❌ The Shop command is not available.", flags: MessageFlags.Ephemeral });
            }
            break;

          case "view_rods":
            // Create the Rods embed
            const rods = [
              { name: "Better Rod", price: 50, description: "Catch better fish!" },
              { name: "Advanced Rod", price: 200, description: "Catch more fish and better items!" },
              { name: "Master Rod", price: 500, description: "Significantly increase your chances of rare fish!" },
            ];

            const rodsEmbed = new EmbedBuilder()
              .setTitle("🛒 Fishing Shop - Rods")
              .setDescription("Buy rods to improve your fishing experience!")
              .setColor("#FFD700");

            rods.forEach((rod) => {
              rodsEmbed.addFields({ name: `${rod.name} - ${rod.price} coins`, value: rod.description });
            });

            const rodsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("buy_better_rod").setLabel("Buy Better Rod").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_advanced_rod").setLabel("Buy Advanced Rod").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_master_rod").setLabel("Buy Master Rod").setStyle(ButtonStyle.Primary)
            );

            await interaction.update({ embeds: [rodsEmbed], components: [rodsRow] });
            break;

          case "view_baits":
            // Create the Baits embed
            const baits = [
              { name: "Premium Bait", price: 30, description: "Increase your chances of rare fish!" },
              { name: "Golden Bait", price: 150, description: "Greatly increase your chances of rare fish!" },
              { name: "Legendary Bait", price: 400, description: "Almost guarantee rare fish and reduce trash!" },
            ];

            const baitsEmbed = new EmbedBuilder()
              .setTitle("🛒 Fishing Shop - Baits")
              .setDescription("Buy baits to improve your fishing experience!")
              .setColor("#FFD700");

            baits.forEach((bait) => {
              baitsEmbed.addFields({ name: `${bait.name} - ${bait.price} coins`, value: bait.description });
            });

            const baitsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("buy_premium_bait").setLabel("Buy Premium Bait").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("buy_golden_bait").setLabel("Buy Golden Bait").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("buy_legendary_bait").setLabel("Buy Legendary Bait").setStyle(ButtonStyle.Secondary)
            );

            await interaction.update({ embeds: [baitsEmbed], components: [baitsRow] });
            break;

          case "buy_better_rod":
            if (user.coins >= 50) {
              user.coins -= 50;
              user.rod = "Better Rod";
              updateUserData(userId, user);
              await interaction.reply({ content: "✅ You purchased the Better Rod!", ephemeral: true });
            } else {
              await interaction.reply({ content: "❌ You don't have enough coins to buy the Better Rod.", ephemeral: true });
            }
            break;

          case "buy_advanced_rod":
            if (user.coins >= 200) {
              user.coins -= 200;
              user.rod = "Advanced Rod";
              updateUserData(userId, user);
              await interaction.reply({ content: "✅ You purchased the Advanced Rod!", ephemeral: true });
            } else {
              await interaction.reply({ content: "❌ You don't have enough coins to buy the Advanced Rod.", ephemeral: true });
            }
            break;

          case "buy_master_rod":
            if (user.coins >= 500) {
              user.coins -= 500;
              user.rod = "Master Rod";
              updateUserData(userId, user);
              await interaction.reply({ content: "✅ You purchased the Master Rod!", ephemeral: true });
            } else {
              await interaction.reply({ content: "❌ You don't have enough coins to buy the Master Rod.", ephemeral: true });
            }
            break;

          case "buy_premium_bait":
            // Create buttons for selecting quantity
            const quantityRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("buy_premium_bait_1").setLabel("Buy 1").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_premium_bait_5").setLabel("Buy 5").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_premium_bait_10").setLabel("Buy 10").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_premium_bait_20").setLabel("Buy 20").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("buy_premium_bait_100").setLabel("Buy 100").setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({
              content: "How many Premium Baits would you like to buy?",
              components: [quantityRow],
              ephemeral: true,
            });
            break;

          case "buy_premium_bait_1":
          case "buy_premium_bait_5":
          case "buy_premium_bait_10":
          case "buy_premium_bait_20":
          case "buy_premium_bait_100":
            const quantity = parseInt(interaction.customId.split("_").pop()); // Extract quantity from customId
            const cost = quantity * 30; // Calculate total cost (30 coins per bait)

            if (user.coins >= cost) {
              user.coins -= cost;
              user.bait = "Premium Bait";
              user.baitCount += quantity; // Increment bait count
              updateUserData(userId, user);
              await interaction.reply({
                content: `✅ You purchased ${quantity} Premium Baits! You now have ${user.baitCount} Premium Baits equipped.`,
                ephemeral: true,
              });
            } else {
              await interaction.reply({
                content: `❌ You don't have enough coins to buy ${quantity} Premium Baits. You need ${cost} coins.`,
                ephemeral: true,
              });
            }
            break;

          case "buy_golden_bait":
            if (user.coins >= 150) {
              user.coins -= 150;
              user.bait = "Golden Bait";
              user.baitCount += 1; // Increment bait count
              updateUserData(userId, user);
              await interaction.reply({ content: `✅ You purchased Golden Bait! You now have ${user.baitCount} Golden Baits equipped.`, ephemeral: true });
            } else {
              await interaction.reply({ content: "❌ You don't have enough coins to buy Golden Bait.", ephemeral: true });
            }
            break;

          case "buy_legendary_bait":
            if (user.coins >= 400) {
              user.coins -= 400;
              user.bait = "Legendary Bait";
              user.baitCount += 1; // Increment bait count
              updateUserData(userId, user);
              await interaction.reply({ content: `✅ You purchased Legendary Bait! You now have ${user.baitCount} Legendary Baits equipped.`, ephemeral: true });
            } else {
              await interaction.reply({ content: "❌ You don't have enough coins to buy Legendary Bait.", ephemeral: true });
            }
            break;

          default:
            await interaction.reply({ content: "❌ Unknown button action.", ephemeral: true });
            break;
        }
      }
    } catch (error) {
      console.error("Error handling button interaction:", error);

      // Handle errors gracefully
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: "❌ An error occurred while handling this button interaction.", ephemeral: true });
      }
    }
  });
};