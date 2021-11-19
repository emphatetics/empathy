require('dotenv').config()
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const database = require('./db/database')

database.connect();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isContextMenu()) return;

	const { commandName } = interaction;

	if (commandName === 'report_message') {
		await interaction.reply('Pong!');
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        juryChannel.send("miau mutta action")
	} else if (commandName === 'thank_user') { 
        await interaction.reply('kiitit just jotai tyyppiä!');
    }
});

client.login(process.env.DISCORD_TOKEN);