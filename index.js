var Botkit = require('botkit');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_incomingwebhook/',
}).configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  scopes: ['incoming-webhook'],
});

var bot = controller.spawn({
  token: 'xoxb-51592064946-j75OqoNzCUcRYFsQxrC27uaT'
});

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.setupWebserver(process.env.port,function(err,webserver) {
  webserver.post('/github_webhooks',function(req,res) {
  });

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

// give the bot something to listen for.
controller.hears(['hello', 'help'],['direct_message','direct_mention','mention'], function(bot,message) {
 bot.reply(message,"Hello yourself.\nHere's a list of commands you can use:\n accept\n decline\n help\n And if you accepted review you can use some more commands:\n done\n support/reconfirm" );
});

// user accept review of pull request
controller.hears('accept',['direct_message'],function(bot,message) {
 bot.reply(message,"It is your time to review, Good Luck!");
});

// user decline review of pull request
controller.hears('decline',['direct_message'],function(bot,message) {
 bot.reply(message,"Oh... I will send this offer to another review man.");
});

// user done review of pull request
controller.hears('done',['direct_message'],function(bot,message) {
 bot.reply(message,"Thank you! You have 1 more point in your stats.");
});

// user needs support to review of pull request
controller.hears(['support', 'reconfirm'],['direct_message','direct_mention','mention'],function(bot,message) {
 bot.reply(message,"Thank you for your work. Now I sent this review for confirmation.");
});
