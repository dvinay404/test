// 'use strict';
// const express = require('express');
// const bodyParser = require('body-parser');
// const Alexa = require('alexa-sdk');

// const handlers = require('./app').handlers;

// // Initialize express server
// const server = express();
// server.use(bodyParser.json());

// // Create POST route
// server.post('/', (req, res) => {
//   //console.log(req);
//   // Create dummy context with fail and succeed functions
//   const context = {
//     fail: () => {
//       // Simply fail with internal server error
//       res.sendStatus(500);
//     },
//     succeed: data => {
//       // console.log(data)
//       res.send(data);
//     }
//   };

//   // Initialize alexa sdk
//   const alexa = Alexa.handler(req.body, context);
//   alexa.appId = 'amzn1.ask.skill.be4b1406-3568-47bf-849d-10da51051b91';
//   alexa.registerHandlers(handlers);
//   alexa.execute();
// });

// // Start express server
// server.listen(3000, () => {

//   console.log('Example app listening on port 3000!')
// });
