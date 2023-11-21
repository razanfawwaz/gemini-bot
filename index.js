require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { DiscussServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/chat-bison-001";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const palmClient = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey(process.env.PALM_API_KEY),
});

client.on("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const userMessage = message.content
      .replace(`<@!${client.user.id}>`, "")
      .trim();
    const response = await palmClient.generateMessage({
      model: MODEL_NAME,
      temperature: 0.5,
      candidateCount: 1,
      prompt: {
        messages: [{ content: userMessage }],
      },
    });
    const reply = response[0].candidates[0].content;

    // due to Discord limitations, we can only send 2000 characters at a time, so we need to split the message
    if (reply.length > 2000) {
      const replyArray = reply.match(/[\s\S]{1,2000}/g);
      replyArray.forEach(async (msg) => {
        await message.reply(msg);
      });
      return;
    }

    message.reply(reply);
  }
});

client.login(process.env.DISCORD_API_KEY);
