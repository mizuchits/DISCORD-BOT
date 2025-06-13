const logger = require("@turkerssh/logger");
const { readdirSync } = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const config = require("../../config");

module.exports = (client) => {
  const commands = [];
  const commandFiles = readdirSync("./src/commands").filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(`../commands/${file}`);
      if (command.data && typeof command.data.toJSON === "function") {
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
        logger.info({
          type: "commands",
          message: `Loaded command: ${command.data.name}`,
        });
      } else {
        logger.error({
          type: "commands",
          message: `Command file ${file} is missing a valid 'data' property.`,
        });
      }
    } catch (error) {
      logger.error({
        type: "commands",
        message: `Error loading command file ${file}: ${error.message}`,
      });
    }
  }

  logger.success({
    type: "commands",
    message: `Successfully loaded ${commands.length} commands.`,
  });

  const rest = new REST({ version: "9" }).setToken(config.GeneralInformation.BotToken);

  (async () => {
    try {
      const guildId = "1376898795064787007"; // Replace with your Discord server (guild) ID
      console.log("Registering commands for guild:", guildId);
      await rest.put(
        Routes.applicationGuildCommands(config.GeneralInformation.BotId, guildId),
        { body: commands },
      );

      logger.success({
        type: "commands",
        message: "Successfully registered guild-specific application commands.",
      });
    } catch (error) {
      logger.error({
        type: "commands",
        message: "Error while registering guild-specific application commands.",
      });
      console.error("Command registration error:", error);
    }
  })();
};
