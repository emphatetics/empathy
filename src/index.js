require('dotenv').config()
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const database = require('./db/database')

database.connect();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (interaction.isContextMenu()) {
        const { commandName } = interaction;

        if (commandName === 'Report message') {
            const reasons = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('reason')
                        .setPlaceholder('Choose reason')
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
                            {
                                label: 'Other',
                                description: 'Something else.',
                                value: 'other',
                            }
                        ]),
            );
            await interaction.reply({ content: 'Please specify a reason for reporting this message.', ephemeral: true, components: [reasons] });
        } else if (commandName === 'Thank user') { 
            await interaction.reply('kiitit just jotai tyyppiä!');
        }
    } else if (interaction.isSelectMenu()) {
        console.log(interaction);
        if (interaction.customId === 'reason') {
            await interaction.update({ content: 'Thank you for reporting this message!', components: [] });
            const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);

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
                juryMessageId: 'khinkalya',
                reason: 'other'
            })
        }
    }
});

client.login(process.env.DISCORD_TOKEN);