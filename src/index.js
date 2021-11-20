require("dotenv").config();
const reasons = require("./reasons");
const queue = require("./queue");
const {
    Client,
    Intents,
    MessageActionRow,
    MessageSelectMenu,
} = require("discord.js");
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
        const kindReducer = (kind) => ((prev, cur) => (cur.kind == kind ? (cur.vote == 'positive' ? prev + 1 : prev - 1) : prev))
        const bans = [...votes].reduce(kindReducer('ban'), 0)
        const deletes = [...votes].reduce(kindReducer('delete'), 0)

        const [report] = await database.Reports.findAll({
            where: {
                id: reportId
            }
        })
        let actionsTaken = report.actionsTaken.split(',');
        
        async function addActionsTaken(name) {
        actionsTaken.push(name)
           
            await database.Reports.update({
                actionsTaken: actionsTaken.join(',')
            }, {
                where: {
                    id: reportId
                }
            })
        }
        if (bans >= process.env.BAN_THRESHOLD && !report.actionsTaken.split(',').includes('ban')) {
            interaction.followUp("Looks like someone's getting banned! 😈")
            const [channelId, messageId] = report.targetId.split('/')
            const channel = await client.channels.fetch(channelId)
            const message = await channel.messages.fetch(messageId)
            console.log(message)
            message.member.ban({days: 1, reason: "get banned by empathy"})
            //const member = interaction.guild.members.fetch(report.targetId)
            //console.log(member)
            await addActionsTaken('ban')
        }
        if (deletes >= process.env.DELETE_THRESHOLD && !report.actionsTaken.split(',').includes('delete')) {
            const [channelId, messageId] = report.targetId.split('/')
            const channel = await client.channels.fetch(channelId)
            const message = await channel.messages.fetch(messageId)
            console.log(message)

            message.delete()
            interaction.followUp("Offender's message got deleted! Good job community! ✨ #BadVibesNever")
            await addActionsTaken('delete')
        }



        console.log(bans, deletes)
        console.log(interaction.message.embeds[0].fields)
        const embeds = interaction.message.embeds;
        embeds[0].fields = juryMessageFields(bans, deletes);

        const delState = !actionsTaken.includes('delete');
        const banState = !actionsTaken.includes('ban');

        const extra = interaction.message.id + "_" + report.id;
        const comps = createComponents(banState, delState, extra);
        interaction.message.edit({ embeds,  components: 
            comps})
        console.log(comps)
    }
});

function createComponents(bans, deletes, extra) {
    return [
        {
            "type": 1,
            "components": [
                ...(deletes ? [
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
                ] : []),
                ...(bans ? [
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
                ] : [])
            ]
        }
    ]
}
async function summonShaman(interaction, isInteraction) {
    let originalMessage;
    let reaction = interaction
    if (isInteraction) {
        const originalInteractionId = interaction.message.interaction.id;
        const originalMessageId = reportsMap.get(originalInteractionId);
        if (!originalMessageId) {
            return await interaction.update({
                content:
                    "Thank you for reporting this message! The message has been already removed, so the report was not filed!",
                components: [],
            });
        }
        originalMessage = await interaction.channel.messages.fetch(
            originalMessageId
        );
        if (!originalMessage) {
            return await interaction.update({
                content:
                    "Thank you for reporting this message! The message has been already removed, so the report was not filed!",
                components: [],
            });
        }
    } else {
        originalMessage = interaction.message
    }
    
   

    const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);

    let karmaUser = await database.User.findOne({ 
        where: {
            discordID: originalMessage.author.id,
        }
    });
    if (!karmaUser) karmaUser = {karma: 0};

//        console.log(reaction.users.cache, reaction.users)

        const report = await database.Reports.create({
            type: 'message',
            targetId: reaction.message.channel.id + '/' + reaction.message.id,
            juryMessageId: 'tba',
            reason: isInteraction ? interaction.values[0] : 'other'
        })

        console.log(report)
        const embed = {
            color: 0x0099ff,
            title: `Community moderation for ${reaction.message.author.tag}'s message`,
            author: {
                name: reaction.message.author.tag,
                icon_url: reaction.message.author.displayAvatarURL()
            },
            description: `Vote for action\n\nReported user's karma: **${karmaUser.karma}**\nReason: **${isInteraction ? 
                reasons.find(
                    (reason) => reason.value === interaction.values[0]
                ).label
            : 'other'}**\n\nReported message:\n>>> ${originalMessage.content}`,
            fields: juryMessageFields(0,0)
        };
        const extra = reaction.message.id + "_" + report.id;

        const sent = await juryChannel.send({ embeds: [embed], components: createComponents(true, true, extra) });

        database.Reports.update({
            juryMessageId: sent.id
        }, {
            where: {
                id: report.id
            }
        })
        console.log("moi")  

        if (isInteraction) {
            await interaction.update({
                content: "Thank you for reporting this message!",
                components: [],
            });
        }
       
        
}

client.on('messageReactionAdd', async (reaction, user) => {
    console.log(reaction.emoji.name, reaction.count)
    if (reaction.emoji.name == '🍴' && reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD) {
        summonShaman(reaction)
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    queue.push(message);
});
const reportsMap = new Map(); // For holding IDs for in progress reports

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        if (commandName === "ping") {
            await interaction.reply("Pong!");
        } else if (commandName === "server") {
            await interaction.reply(
                `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
            );
        } else if (commandName === "info") {
            if (interaction.options.getSubcommand() === "user") {
                const user = interaction.options.getUser("target");

                if (user) {
                    await interaction.reply(
                        `Username: ${user.username}\nID: ${user.id}`
                    );
                } else {
                    // systeemi heittää nyt valitun userin tiedot vastauksena.   |  Ephemeral: true => komennon suorittaja näkee ainoastaan botin vastauksen
                    await interaction.reply({
                        content: `Your username: ${interaction.user.username}\nYour ID: ${interaction.user.id}`,
                        ephemeral: true,
                    });
                }
            } else if (interaction.options.getSubcommand() === "server") {
                await interaction.reply(
                    `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
                );
            }
        }
    } else if (interaction.isContextMenu()) {
        const { commandName } = interaction;
        if (commandName === "Report message") {
            reportsMap.set(interaction.id, interaction.targetId);
            const reasonsComponent = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId("reason")
                    .setPlaceholder("Choose reason")
                    .addOptions(reasons)
            );
            await interaction.reply({
                content: "Please specify a reason for reporting this message.",
                ephemeral: true,
                components: [reasonsComponent],
            });
        } else if (commandName === "Thank user") {
            if (interaction.targetId === interaction.user.id) {
                return await interaction.reply("Or maybe you could thank someone else :)?");
            }
            let User = await database.User.findOne({
                where: {
                    discordID: interaction.user.id,
                }
            });
            if (!User) {
                User = await database.User.create({
                    discordID: interaction.user.id,
                    karma: 0,
                    lastThank: 0,
                });
            }
            if (Date.now() - User.lastThank < 2 * 60 * 60 * 1000) {
                return await interaction.reply({ content: "You can thank someone only once every 2 hours.", ephemeral: true });
            }
            User.lastThank = Date.now();
            User.save();
            let targetUser = await database.User.findOne({
                where: {
                    discordID: interaction.targetId,
                }
            });
            if (!targetUser) {
                targetUser = await database.User.create({
                    discordID: interaction.targetId,
                    karma: 0,
                    lastThank: 0,
                });
            }
            targetUser.karma += 25;
            targetUser.save();
            await interaction.reply({ content: `You thanked <@${interaction.targetId}>! You can thank again in 2 hours.`, ephemeral: true });
        }
    } else if (interaction.isSelectMenu()) {
        const originalInteractionId = interaction.message.interaction.id;
        if (interaction.customId === "reason") {

            summonShaman(interaction, true)
        }

    }
});

client.login(process.env.DISCORD_TOKEN);
