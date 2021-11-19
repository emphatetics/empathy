/**
 * Following code is not licensed under the APACHE-2.0 license above.
 * (C) Copyright 2021 Roni Äikäs, Mikael Hannolainen and Jonas Papathemelis
 */

 require("dotenv").config();
 const { Velocity } = require("velocity-api");
 const database = require("./db/database");
 const queue = [];
 const limit = 0.8;
 const karmaDecrease = 10;
 
 let lastTime = 0; // Last time the request was sent succesfully for rate limiting
 
 async function nextInQueue() {
     if (queue.length > 0 && Date.now() - lastTime > 1000) {
         const message = queue.shift();
         const scores = await analyzeText(message.content);
         const overLimit =
             Object.values(scores).filter((score) => score > limit).length != 0;
         if (overLimit) {
             let user = await database.User.findOne({
                 where: {
                     discordID: message.author.id,
                 },
             });
             if (!user) {
                 user = await database.User.create({
                     discordID: message.author.id,
                     karma: 0,
                 });
             }
             user.karma -= karmaDecrease;
             await user.save();
             console.log(message.author.tag + " karma decreased");
         }
         setTimeout(nextInQueue, 1000);
     } else {
         // console.log('Queue is empty or rate limit, skipping...');
         setTimeout(nextInQueue, 1000);
     }
 }
 
 setTimeout(nextInQueue, 1000);
 
 async function analyzeText(text) {
     const manager = new Velocity(process.env.PERSPECTIVE_API_KEY);
 
     const scores = await manager.processMessage(text, {
         attributes: [
             "TOXICITY",
             "SEVERE_TOXICITY",
             "IDENTITY_ATTACK",
             "INSULT",
             "PROFANITY",
             "THREAT",
             "SEXUALLY_EXPLICIT",
             "SPAM",
             "ATTACK_ON_AUTHOR",
             "ATTACK_ON_COMMENTER",
             "INFLAMMATORY",
             "OBSCENE",
             "SPAM",
         ],
         languages: ["en"],
         doNotStore: false,
         stripHtml: false,
     });
 
     return scores;
 }
 
 module.exports = queue;
 