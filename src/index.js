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

	if (commandName === 'Report message') {
        const reasons = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('reason')
					.setPlaceholder('Other')
					.addOptions([
						{
							label: 'Harassment',
							description: 'Harassment',
							value: 'harassment',
						},
						{
							label: 'Racism/sexism. etc',
							description: 'This message contains racism, sexism, etc',
							value: 'racism_sexism',
						},
                        {
							label: 'NSFW/NSFL Content',
							description: 'This is not safe for work/life content.',
							value: 'nsfw_nsfl',
						},
                        {
							label: 'Malware or malicious message',
							description: 'The message contains malicious content, like viruses or uses exploits',
							value: 'malware',
						},
					]),
		);
		await interaction.reply({ content: 'Please specify a reason for reporting this message.', ephemeral: true, components: [reasons] });
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        juryChannel.send("miau mutta action")
	} else if (commandName === 'Thank user') { 
        await interaction.reply('kiitit just jotai tyyppiä!');
    }
});

client.login(process.env.DISCORD_TOKEN);