require('dotenv').config();

/**
 * Following code is not licensed under the APACHE-2.0 license above.
 * (C) Copyright 2021 Roni Äikäs, Mikael Hannolainen and Jonas Papathemelis
*/

const queue = [];
let lastTime = 0; // Last time the request was sent succesfully for rate limiting

function nextInQueue() {
    if (queue.length > 0 && Date.now() - lastTime > 1000) {
        const text = queue.shift();
        analyzeText(text);
    } else {
        console.log('Queue is empty or rate limit, skipping...');
        setTimeout(nextInQueue, 1000);
    }
}

nextInQueue();

/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { google } = require('googleapis');

// Some supported attributes
// attributes = ["TOXICITY", "SEVERE_TOXICITY", "IDENTITY_ATTACK", "INSULT",
// "PROFANITY", "THREAT", "SEXUALLY_EXPLICIT", "FLIRTATION", "SPAM",
// "ATTACK_ON_AUTHOR", "ATTACK_ON_COMMENTER", "INCOHERENT",
// "INFLAMMATORY", "OBSCENE", "SPAM", "UNSUBSTANTIAL"];

// Set your own thresholds for when to trigger a response
const attributeThresholds = {
  'INSULT': 0.75,
  'TOXICITY': 0.75,
  'SPAM': 0.75,
  'INCOHERENT': 0.75,
  'FLIRTATION': 0.75,
};

/**
 * Analyze attributes in a block of text
 * @param {string} text - text to analyze
 * @return {json} res - analyzed atttributes
 */
async function analyzeText(text) {
  const analyzer = google.commentanalyzer('v1alpha1');

  // This is the format the API expects
  const requestedAttributes = {};
  for (const key in attributeThresholds) {
    requestedAttributes[key] = {};
  }

  const req = {
    comment: {text: text},
    languages: ['en'],
    requestedAttributes: requestedAttributes,
  };

  const res = await analyzer.comments.analyze({
    key: process.env.PERSPECTIVE_API_KEY,
    resource: req
    },
  );
  lastTime = Date.now();

  data = {};

  for (const key in res['data']['attributeScores']) {
    data[key] =
        res['data']['attributeScores'][key]['summaryScore']['value'] >
        attributeThresholds[key];
  }
  setTimeout(nextInQueue, 1000);
  return data;
}