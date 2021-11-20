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
	} else if (commandName === 'thanks') {

  if (interaction.options.getSubcommand() === 'user') {
    const user = interaction.options.getUser('user');
    const texti = interaction.options.getString('texti');
    console.log (user);
    console.log (texti);

    if (user) {
 // määritetään embedi jolla viestit lähetetään ( voikohan iskee process.env filuun?)
      const exampleEmbed = {
        color: 0xf7d80a,
        title: 'Thank you! 🙌🙌',
        url: 'https://discord.js.org',
        author: {
          name: `${user.username}`,
          icon_url: user.displayAvatarURL(),
          url: 'https://discord.js.org',
        },
        description: `${texti}`,
       /* thumbnail: {
          url: ,
        },*/
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
        ],
        image: {
          url: '',
        },
        timestamp: new Date(),
        footer: {
          text: `thanks by <@${interaction.user.username}>`,
          icon_url: interaction.user.displayAvatarURL(),
        },
      };
      // await interaction.reply(`Username: ${user.username}\nID: ${user.id}`);
      await interaction.reply({content: `Your thanks has been sent! 🙌`, ephemeral: true});
           const message = await client.channels.cache.get(process.env.THANKS_CHANNEL_ID).send({ content: ` Hey <@${user.id}> someone thanked you 👌🙌🎉🎉`, embeds:[exampleEmbed], fetchReply: true });
          message.react('🙌')
          .then(() => message.react('🚂'))
			.then(() => message.react('🍇'))
			.catch(error => console.error('One of the emojis failed to react:', error));

      // client.channels.cache.get('911298015329943592').send('Hello here!')

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