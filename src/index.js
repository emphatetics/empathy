require("dotenv").config();
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
const database = require("./db/database");

database.connect();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (commandName === "server") {
    await interaction.reply(
      `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
    );
  } else if (commandName === "thanks") {
    const user = interaction.options.getUser("user");
    const texti = interaction.options.getString("texti");
    console.log(user);
    console.log(texti);

    if (user) {
      // Create the thank you embed
      const exampleEmbed = {
        color: 0xf7d80a,
        // title: `${texti}`,   // uncomment if you want the thankyou string into the title part of the embed character limit is around 250 something

        author: {
          name: `${user.username}`,
          icon_url: user.displayAvatarURL(),
        },
        description: `${texti}`,

        timestamp: new Date(),
        footer: {
          text: `thanks by <@${interaction.user.username}>`,
          icon_url: interaction.user.displayAvatarURL(),
        },
      };

      await interaction.reply({
        content: `Your thanks has been sent! 🙌`,
        ephemeral: true,
      });
      const message = await client.channels.cache
        .get(process.env.THANKS_CHANNEL_ID)
        .send({
          content: ` Hey <@${user.id}> someone thanked you 👌🙌🎉🎉`,
          embeds: [exampleEmbed],
          fetchReply: true,
        });
      message
        .react("🙌")
        .then(() => message.react("🚂"))
        .then(() => message.react("🍇"))
        .catch((error) =>
          console.error("One of the emojis failed to react:", error)
        );
    }
  } else if (interaction.options.getSubcommand() === "server") {
    await interaction.reply(
      `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
    );
  }
});
client.on("messageReactionAdd", async (reaction, user) => {
  console.log(reaction.emoji.name, reaction.count);
  if (
    reaction.emoji.name == "🔴" &&
    reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD
  ) {
    const juryChannel = await client.channels.fetch(
      process.env.JURY_CHANNEL_ID
    );
    juryChannel.send("miau");
    console.log("moi");
  }
});

client.login(process.env.DISCORD_TOKEN);
