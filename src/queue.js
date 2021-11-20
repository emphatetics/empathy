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
 
 const leetTable = {
     1: "i",
     2: "z",
     3: "e",
     4: "a",
     5: "s",
     6: "g",
     7: "t",
     8: "b",
     0: "o",
 };
 
 async function nextInQueue() {
     if (queue.length > 0 && Date.now() - lastTime > 1000) {
         const message = queue.shift();
         if (!message.content || message.content === "") {
             return nextInQueue();
         }
 
         const scores = await analyzeText(message.content);
         console.log(scores);
         // Anti leet
         const normalLeet = message.content
             .split("")
             .map((char) => leetTable[char] || char)
             .join("");
         if (normalLeet !== message.content) {
             message.content = normalLeet;
             queue.push(message);
         }
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
                     lastThank: 0,
                 });
             }
             user.karma -= karmaDecrease;
             await user.save();
             message.react("😞");
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
             "THREAT",
         ],
         languages: ["en"],
         doNotStore: false,
         stripHtml: false,
     });
 
     return scores;
 }
 
 module.exports = queue;
 