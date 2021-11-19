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
            await interaction.reply({ content: `You thanked <@${interaction.targetId}>! You can thank again in 2 hours.`, ephemeral: true});
        }
    } else if (interaction.isSelectMenu()) {
        const originalInteractionId = interaction.message.interaction.id;
        if (interaction.customId === "reason") {
            const originalMessageId = reportsMap.get(originalInteractionId);
            if (!originalMessageId) {
                return await interaction.update({
                    content:
                        "Thank you for reporting this message! The message has been already removed, so the report was not filed!",
                    components: [],
                });
            }
            const originalMessage = await interaction.channel.messages.fetch(
                originalMessageId
            );
            if (!originalMessage) {
                return await interaction.update({
                    content:
                        "Thank you for reporting this message! The message has been already removed, so the report was not filed!",
                    components: [],
                });
            }
            const juryChannel = await client.channels.fetch(
                process.env.JURY_CHANNEL_ID
            );
            
            let karmaUser = await database.User.findOne({ 
                where: {
                    discordID: originalMessage.author.id,
                }
            });
            if (!karmaUser) karmaUser = {karma: 0};
            
            const embed = {
                color: 0x0099ff,
                title: `Community moderation for ${originalMessage.author.tag}'s message`,
                author: {
                    name: `${originalMessage.author.tag} (${originalMessage.author.id})`,
                    icon_url: originalMessage.author.displayAvatarURL(),
                },
                description: `Vote for action\n\nReported user's karma: **${karmaUser.karma}**\nReason: **${
                    reasons.find(
                        (reason) => reason.value === interaction.values[0]
                    ).label
                }**\n\nReported message:\n>>> ${originalMessage.content}`,
                fields: [
                    {
                        name: "Delete",
                        value: "0/2 votes",
                        inline: true,
                    },
                    {
                        name: "Ban",
                        value: "0/7 votes",
                        inline: true,
                    },
                ],
            };
            const message = await juryChannel.send({
                embeds: [embed],
                attachments: originalMessage.attachments,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Delete",
                                style: 1,
                                custom_id: "a",
                                emoji: {
                                    id: null,
                                    name: "👍",
                                },
                            },
                            {
                                type: 2,
                                label: "Delete",
                                style: 1,
                                custom_id: "b",
                                emoji: {
                                    id: null,
                                    name: "👎",
                                },
                            },
                            {
                                type: 2,
                                label: "Ban",
                                style: 4,
                                custom_id: "c",
                                emoji: {
                                    id: null,
                                    name: "👍",
                                },
                            },
                            {
                                type: 2,
                                label: "Ban",
                                style: 4,
                                custom_id: "d",
                                emoji: {
                                    id: null,
                                    name: "👎",
                                },
                            },
                        ],
                    },
                ],
            });

            database.Reports.create({
                type: "message",
                targetId: originalMessage.id,
                juryMessageId: message.id,
                reason: interaction.values[0],
            });

            await interaction.update({
                content: "Thank you for reporting this message!",
                components: [],
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
