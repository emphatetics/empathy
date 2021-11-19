const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// hardcode why not
const clientId = "630328716047679488";
const guildId = "911268796109582398"
const token = "NjMwMzI4NzE2MDQ3Njc5NDg4.XZmtXA.noQnfsn9PcqXbu4bAluvxgnc87g";

const { SlashCommandBuilder } = require('@discordjs/builders');

const reportCommand = new SlashCommandBuilder()
	.setName('report_message')
	.setDescription('Abc')
    .toJSON();
delete reportCommand["description"];
reportCommand["type"] = 3; // Message thingy

const thankCommand = new SlashCommandBuilder()
	.setName('thank_user')
	.setDescription('Abc')
    .toJSON();
delete thankCommand["description"];
thankCommand["type"] = 2; // Message thingy


const commands = [reportCommand, thankCommand];

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands,  })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

