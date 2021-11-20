const database = require("./db/database");
const reasons = require("./reasons");

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
const reportsMap = new Map(); // For holding IDs for in progress reports


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

async function summonShaman(client, interaction, isInteraction) {
    let originalMessage;
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
        originalMessage = interaction;
    }

    const juryChannel = await client.channels.fetch(
        process.env.JURY_CHANNEL_ID
    );

    let karmaUser = await database.User.findOne({
        where: {
            discordID: originalMessage.author.id,
        },
    });
    if (!karmaUser) karmaUser = { karma: 0 };

    //        console.log(reaction.users.cache, reaction.users)

    const report = await database.Reports.create({
        type: "message",
        targetId: originalMessage.channel.id + "/" + originalMessage.id,
        juryMessageId: "tba",
        reason: isInteraction ? interaction.values[0] : "other",
    });

    console.log(report);
    const embed = {
        color: 0x0099ff,
        title: `Community moderation for ${originalMessage.author.tag}'s message`,
        author: {
            name: `${originalMessage.author.tag} (${originalMessage.author.id})`,
            icon_url: originalMessage.author.displayAvatarURL(),
        },
        description: `Vote for action\n\nReported user's karma: **${
            karmaUser.karma
        }**\nReason: **${
            isInteraction
                ? reasons.find(
                      (reason) => reason.value === interaction.values[0]
                  ).label
                : "toxicity (autodetected)"
        }**\n\nReported message:\n>>> ${originalMessage.content}`,
        fields: juryMessageFields(0, 0),
    };
    const extra = originalMessage.id + "_" + report.id;

    const sent = await juryChannel.send({
        embeds: [embed],
        components: createComponents(true, true, extra),
    });

    database.Reports.update(
        {
            juryMessageId: sent.id,
        },
        {
            where: {
                id: report.id,
            },
        }
    );
    console.log("moi");

    if (isInteraction) {
        await interaction.update({
            content: "Thank you for reporting this message!",
            components: [],
        });
    }
}

module.exports = { juryMessageFields, summonShaman, createComponents, reportsMap };