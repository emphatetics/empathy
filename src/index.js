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
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
	} else if (commandName === 'info') {

  if (interaction.options.getSubcommand() === 'user') {
    const user = interaction.options.getUser('user');
    console.log (user);
    

    if (user) {

      const exampleEmbed = {
        color: 0x0099ff,
        title: 'Some title',
        url: 'https://discord.js.org',
        author: {
          name: 'Some name',
          icon_url: 'https://i.imgur.com/AfFp7pu.png',
          url: 'https://discord.js.org',
        },
        description: 'Some description here',
        thumbnail: {
          url: 'https://i.imgur.com/AfFp7pu.png',
        },
        fields: [
          {
            name: `${user.username}`,
            value: 'Some value here',
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: false,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
        ],
        image: {
          url: 'https://i.imgur.com/AfFp7pu.png',
        },
        timestamp: new Date(),
        footer: {
          text: 'Some footer text here',
          icon_url: 'https://i.imgur.com/AfFp7pu.png',
        },
      };
      // await interaction.reply(`Username: ${user.username}\nID: ${user.id}`);
      await interaction.reply({ embeds:[ {
        color: 0x0099ff,
        title: 'Some title',
        url: 'https://discord.js.org',
        author: {
          name: 'Some name',
          icon_url: 'https://i.imgur.com/AfFp7pu.png',
          url: 'https://discord.js.org',
        },
        description: 'Some description here',
        thumbnail: {
          url: 'https://i.imgur.com/AfFp7pu.png',
        },
        fields: [
          {
            name: `${user.username}`,
            value: 'Some value here',
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: false,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
          {
            name: 'Inline field title',
            value: 'Some value here',
            inline: true,
          },
        ],
        image: {
          url: 'https://i.imgur.com/AfFp7pu.png',
        },
        timestamp: new Date(),
        footer: {
          text: 'Some footer text here',
          icon_url: 'https://i.imgur.com/AfFp7pu.png',
        },
      } ]});

    } else {
      // systeemi heittää nyt valitun userin tiedot vastauksena.   |  Ephemeral: true => komennon suorittaja näkee ainoastaan botin vastauksen
      await interaction.reply({content:`Your username: ${interaction.user.username}\nYour ID: ${interaction.user.id}`, ephemeral: true});
    }
  } else if (interaction.options.getSubcommand() === 'server') {
    await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
  }	


  
  
 // channel.send({ embeds: [exampleEmbed] });







}
});
client.on('messageReactionAdd', async (reaction, user) => {
    console.log(reaction.emoji.name, reaction.count)
    if (reaction.emoji.name == '🔴' && reaction.count >= process.env.MESSAGE_REPORT_THRESHOLD) {
        const juryChannel = await client.channels.fetch(process.env.JURY_CHANNEL_ID);
        juryChannel.send("miau")
        console.log("moi")  
    }
})

client.login(process.env.DISCORD_TOKEN);