const logger = require("@turkerssh/logger");
const { ShardingManager, WebhookClient } = require("discord.js");

const config = require("../config");

const webhook = new WebhookClient({
  url: config.WebhookInformation.ShardWebhook,
});

exports.run = async () => {
  const manager = new ShardingManager('./src/bot.js', {
    token: config.GeneralInformation.BotToken,
    totalShards: 'auto',
  });

  manager.on('shardCreate', async (shard) => {
    console.log(`Shard ${shard.id} launched`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay between shard launches
  });

  manager.spawn().catch(async (err) => {
    if (err.status === 429) {
      const retryAfter = err.headers.get('Retry-After') || 5; // Retry after specified time
      console.log(`Rate limited. Retrying shard spawn after ${retryAfter} seconds.`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      manager.spawn(); // Retry shard spawning
    } else {
      console.error('Error while spawning shards:', err);
    }
  });
};
