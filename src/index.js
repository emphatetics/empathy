require('dotenv').config()
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const database = require('./db/database')

database.connect();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply('Server info.');
	} else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});
client.on('messageReactionAdd', async (reaction, user) => {
    console.log(reaction.emoji.name, reaction.count)
    if (reaction.emoji.name == '🔴' && reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD) {
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        juryChannel.send("miau")
        console.log("moi")  
    }
})

client.login(process.env.DISCORD_TOKEN);