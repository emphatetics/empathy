require("dotenv").config();
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
	new SlashCommandBuilder()
	    .setName('thank')
	    .setDescription('Thank a user 🙌')
			.addUserOption(option => 
				option
				.setName('user')
				.setDescription('The user')
				.setRequired(true))
			.addStringOption(option => 
				option
				.setName('texti')
				.setDescription('The text')
				.setRequired(true)),
    new SlashCommandBuilder()
        .setName("placeholder")
        .setDescription("Placeholder"),
]
	.map(command => command.toJSON());

delete commands[3]["description"]; // User settings can't have descriptions
commands[3]["name"] = "Report message"; // Discord doesn't support these straight out the box
commands[3]["type"] = 3; // Message thingy

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

rest.put(
    Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
    ),
    { body: commands }
)
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
