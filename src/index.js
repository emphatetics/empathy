require("dotenv").config();
const reasons = require("./reasons");
const queue = require("./queue");
const summonShaman = require('./summonShaman')
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

const juryMessageFields = (bans, deletes) => [
    {
        value: `${deletes} / ${process.env.DELETE_THRESHOLD} votes`,
        name: "Delete",
        inline: true,
    },
    {
        value: `${bans} / ${process.env.BAN_THRESHOLD} votes`,
        name: "Ban",
        inline: true,
    },
];

function createComponents(bans, deletes, extra) {
    return [
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
                        },
                        "disabled": !deletes
                    },
                    {
                        "type": 2,
                        "label": "Delete",
                        "style": 1,
                        "custom_id": "delete_negative_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        },
                        "disabled": !deletes
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "ban_positive_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👍"
                        },
                        "disabled": !bans
                    },
                    {
                        "type": 2,
                        "label": "Ban",
                        "style": 4,
                        "custom_id": "ban_negative_" + extra,
                        "emoji": {
                            "id": null,
                            "name": "👎"
                        },
                        "disabled": !bans
                    }
            ]
        }
    ]
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    queue.push(message);
});
const reportsMap = new Map(); // For holding IDs for in progress reports

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        const [kind, vote, targetId, reportId] =
            interaction.customId.split("_");
        console.log(kind, vote, targetId);
        await database.Votes.upsert({
            userId: interaction.user.id,
            targetId,
            kind,
            vote,
            reportId,
        });
        interaction.reply({ content: "Thanks for voting!", ephemeral: true });

        // update original embed
        const votes = await database.Votes.findAll({
            where: {
                reportId,
            },
        });
        const kindReducer = (kind) => (prev, cur) =>
            cur.kind == kind
                ? cur.vote == "positive"
                    ? prev + 1
                    : prev - 1
                : prev;
        const bans = [...votes].reduce(kindReducer("ban"), 0);
        const deletes = [...votes].reduce(kindReducer("delete"), 0);

        const [report] = await database.Reports.findAll({
            where: {
                id: reportId,
            },
        });
        let actionsTaken = report.actionsTaken.split(",");

        async function addActionsTaken(name) {
            actionsTaken.push(name);

            await database.Reports.update(
                {
                    actionsTaken: actionsTaken.join(","),
                },
                {
                    where: {
                        id: reportId,
                    },
                }
            );
        }
        if (
            bans >= process.env.BAN_THRESHOLD &&
            !report.actionsTaken.split(",").includes("ban")
        ) {
            interaction.followUp("Looks like someone's getting banned! 😈");
            const [channelId, messageId] = report.targetId.split("/");
            const channel = await client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);
            console.log(message);
            message.member.ban({ days: 1, reason: "get banned by empathy" });
            //const member = interaction.guild.members.fetch(report.targetId)
            //console.log(member)
            await addActionsTaken("ban");
        }
        if (
            deletes >= process.env.DELETE_THRESHOLD &&
            !report.actionsTaken.split(",").includes("delete")
        ) {
            const [channelId, messageId] = report.targetId.split("/");
            const channel = await client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);
            console.log(message);

            message.delete();
            interaction.followUp(
                "Offender's message got deleted! Good job community! ✨ #BadVibesNever"
            );
            await addActionsTaken("delete");
        }

        console.log(bans, deletes);
        console.log(interaction.message.embeds[0].fields);
        const embeds = interaction.message.embeds;
        embeds[0].fields = juryMessageFields(bans, deletes);

        const delState = !actionsTaken.includes("delete");
        const banState = !actionsTaken.includes("ban");

        const extra = interaction.message.id + "_" + report.id;
        const comps = createComponents(banState, delState, extra);
        interaction.message.edit({ embeds, components: comps });
        console.log(comps);
    } else if (interaction.isCommand()) {
        const { commandName } = interaction;
        if (commandName === "ping") {
            await interaction.reply("Pong!");
        } else if (commandName === "server") {
            await interaction.reply(
                `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
            );
        } else if (commandName === "thank") {
            const user = interaction.options.getUser("user");
            const texti = interaction.options.getString("text");

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
                        console.error(
                            "One of the emojis failed to react:",
                            error
                        )
                    );
            }
        } else if (interaction.options.getSubcommand() === "server") {
            await interaction.reply(
                `Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`
            );
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
                return await interaction.reply(
                    "Or maybe you could thank someone else :)?"
                );
            }
            let User = await database.User.findOne({
                where: {
                    discordID: interaction.user.id,
                },
            });
            if (!User) {
                User = await database.User.create({
                    discordID: interaction.user.id,
                    karma: 0,
                    lastThank: 0,
                });
            }
            if (Date.now() - User.lastThank < 2 * 60 * 60 * 1000) {
                return await interaction.reply({
                    content: "You can thank someone only once every 2 hours.",
                    ephemeral: true,
                });
            }
            User.lastThank = Date.now();
            User.save();
            let targetUser = await database.User.findOne({
                where: {
                    discordID: interaction.targetId,
                },
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
            await interaction.reply({
                content: `You thanked <@${interaction.targetId}>! You can thank again in 2 hours.`,
                ephemeral: true,
            });
        }
    } else if (interaction.isSelectMenu()) {
        if (interaction.customId === "reason") {
            summonShaman(client, interaction, true);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
