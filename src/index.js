require('dotenv').config()
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const database = require('./db/database')

database.connect();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

const juryMessageFields = (bans, deletes) => ([
    { value: `${deletes} / ${process.env.DELETE_THRESHOLD} votes`, name: 'Delete', inline: true },
    { value: `${bans} / ${process.env.BAN_THRESHOLD} votes`, name: 'Ban', inline: true }
]
)
client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        const [kind, vote, targetId, reportId] = interaction.customId.split('_');
        console.log(kind, vote, targetId)
        await database.Votes.upsert({
            userId: interaction.user.id,
            targetId, kind, vote, reportId
        })
        interaction.reply({ content: 'Thanks for voting!', ephemeral: true });


        // update original embed
        const votes = await database.Votes.findAll({
            where: {
                reportId
            }
        })
        const kindReducer = (kind) => ( (prev, cur) => (cur.kind == kind ? (cur.vote == 'positive' ? prev + 1 : prev - 1) : prev) )
        const bans = [...votes].reduce(kindReducer('ban'),0)
        const deletes = [...votes].reduce(kindReducer('delete'),0)

        const [report] = await database.Reports.findAll({
            where: {
                id: reportId
            }
        })
        function addActionsTaken(name) {
            let actionsTaken = report.actionsTaken.split(',');
            actionsTaken.push(name)
            database.Reports.update({
                actionsTaken: actionsTaken.join(',')
            }, {
                where: {
                    id: reportId
                }
            })
        }
        if (bans >= process.env.BAN_THRESHOLD && !report.actionsTaken.split(',').includes('ban')) {
            interaction.followUp("Looks like someone's getting banned! 😈")
            addActionsTaken('ban')
        }
        if (deletes >= process.env.DELETE_THRESHOLD && !report.actionsTaken.split(',').includes('delete')) {
            interaction.followUp("Offender's message got deleted! Good job community! ✨ #GoodVibesOnly")
            addActionsTaken('delete')
        }

        

        console.log(bans, deletes)
        console.log(interaction.message.embeds[0].fields)
        const embeds = interaction.message.embeds;
        embeds[0].fields = juryMessageFields(bans, deletes);
        interaction.message.edit({embeds})
    }
});


client.on('messageReactionAdd', async (reaction, user) => {
    console.log(reaction.emoji.name, reaction.count)
    if (reaction.emoji.name == '🍴' && reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD) {
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        console.log(reaction.users.cache, reaction.users)

        const report = await database.Reports.create({
            type: 'message',
            targetId: reaction.message.id,
            juryMessageId: 'tba'
        })

        console.log(report)
        const exampleEmbed = {
            color: 0x0099ff,
            title: `Community moderation for ${reaction.message.author.tag}'s message`,
            author: {
                name: reaction.message.author.tag,
                icon_url: reaction.message.author.displayAvatarURL()
            },
            description: `Vote for action\n\nReported message on channel *${reaction.message.channel.name}*:\n>>> ${reaction.message.content}`,
            fields: juryMessageFields(0,0)
        };
        const extra = reaction.message.id + "_" + report.id;

        const sent = await juryChannel.send({ embeds: [exampleEmbed], components: [
            {
                "type": 1,
                "components": [
                    {
                        "type": 2,
                        "label": "Delete",
                        "style": 1,
                        "custom_id": "delete_positive_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👍"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Delete",
                        "style": 1,
                        "custom_id": "delete_negative_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "ban_positive_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👍"
                        }
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "ban_negative_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        }
                    }
                ]
            }
        ] });

        database.Reports.update({
            juryMessageId: sent.id
        }, {
            where: {
                id: report.id
            }
        })
        console.log("moi")  
    }
})

client.login(process.env.DISCORD_TOKEN);