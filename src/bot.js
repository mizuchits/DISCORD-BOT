const logger = require("@turkerssh/logger");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");

const { EventEmitter } = require("events");
EventEmitter.defaultMaxListeners = 20; // Increase the limit to 20

const config = require("../config");

const Bottleneck = require("bottleneck");

const limiter = new Bottleneck({
  maxConcurrent: 3, // Number of concurrent requests
  minTime: 1000,    // Minimum time between requests (in ms)
});

const client = new Client({
  intents: [Object.keys(GatewayIntentBits)],
  partials: [Object.keys(Partials)],
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
});

client.interaction = new Collection();
client.commands = new Collection();
client.cooldowns = new Collection();
client.shards = new Collection();

["events", "commands"].filter(Boolean).forEach((h) => {
  require(`./handlers/${h}`)(client);
});

process.on("unhandledRejection", (err) => {
  logger.error({
    type: "client",
    message: err,
  });
});

process.on("uncaughtException", (err) => {
  logger.error({
    type: "client",
    message: err,
  });
});

process.on("warning", (warning) => {
  logger.warn({
    type: "client",
    message: warning,
  });
});

// Wrap API calls
limiter.schedule(() => interaction.reply({ content: "Your response here" }));

async function safeApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.status === 429) {
      const retryAfter = error.headers.get("Retry-After") || 1;
      console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return safeApiCall(apiFunction); // Retry the API call
    }
    throw error;
  }
}

client.login(config.GeneralInformation.BotToken).catch((err) => {
  logger.error({
    type: "client",
    message: "Error while logging in",
  });
  console.dir(err);
});
