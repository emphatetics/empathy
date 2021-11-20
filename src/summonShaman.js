async function summonShaman(interaction, isInteraction) {
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
        reason: isInteraction ? interaction.values[0] : "toxicity (autodetected)",
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

module.exports = summonShaman;