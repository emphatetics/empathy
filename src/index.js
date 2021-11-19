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
    if (reaction.emoji.name == '🍴' && reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD) {
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        console.log(reaction.users.cache, reaction.users)

        const exampleEmbed = {
            color: 0x0099ff,
            title: `Community moderation for ${reaction.message.author.tag}'s message`,
            author: {
                name: reaction.message.author.tag,
                icon_url: reaction.message.author.displayAvatarURL()
            },
            description: `Vote for action\n\nReported message:\n>>> ${reaction.message.content}`,
            fields: [
                {
                    name: 'Delete',
                    value: '0/2 votes',
                    inline: true
                },
                {
                    name: 'Ban',
                    value: '0/7 votes',
                    inline: true
                },
            ]
        };
        
        juryChannel.send({ embeds: [exampleEmbed], components: [
            {
                "type": 1,
                "components": [
                    {
                        "type": 2,
                        "label": "Delete",
                        "style": 1,
                        "custom_id": "a",
                        "emoji": {
                            "id": null,
                            "name": "👍"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Delete",
                        "style": 1,
                        "custom_id": "b",
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "c",
                        "emoji": {
                            "id": null,
                            "name": "👍"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "d",
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        }
                    }
                ]
            }
        ] });

        database.Reports.create({
            type: 'message',
            targetId: reaction.message.id,
            juryMessageId: 'khinkalya'
        })
        console.log("moi")  
    }
})

client.login(process.env.DISCORD_TOKEN);