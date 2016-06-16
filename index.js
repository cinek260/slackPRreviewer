var Botkit = require('botkit');
var http = require("http");
var https = require("https");

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
  token: 'xoxb-51511018515-F6s2BCac1bhytbZ8ATCIKsrv'
});

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.setupWebserver(process.env.port,function(err,webserver) {
  webserver.get('/',function(req,res) {
    var html = '<h1>Yo</h1>POST to /github_webhooks\n';
    controller.storage.users.all(function(err, all_user_data) {
      html = html + all_user_data
    });
    res.send(html);
  });

  webserver.post('/github_webhooks',function(req,res) {
    var event = req.get('X-GitHub-Event');
    if(event==='pull_request'){
      if(req.body.action==="opened"){
        console.log(req.body.pull_request.url)

        var options = {
          host: 'api.github.com',
          port: 443,
          path: req.body.pull_request.url.substring(22) + '/files',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        getJSON(options, function(statusCode, result){
          console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
          res.statusCode = statusCode;
          res.send(result);
        });
      } else {
        res.status(200).send('action is not open')
      }
    } else {
      res.status(200).send('event is not pull_request')
    }
  });

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

// // give the bot something to listen for.
// controller.hears('hello',['direct_message'],function(bot,message) {
//   bot.reply(message,"Hello yourself.\n" );
// });

// // user need help
// controller.hears('help',['direct_message'],function(bot,message) {
//  bot.reply(message,"Hello, if you done a review fill DONE.\n Else if you need confirmation from another reviewer with review fill RECONFIRM.\n Maybe you wouldn't like to make review then fill DECLINE.");
// });



// controller.on('direct_message', function(bot, message) {
//   var set_up_user = true
//   if (message) {
//     controller.storage.users.get(id, function(err, user_data) {
//       if (user_data) {
//         set_up_user = false
//       }
//     });

//     controller.storage.users.save({id: message.user, saved: true}, function(err) {
//       bot.reply(message,"Saved info about you" );
//     });

//     if (set_up_user) {
//       bot.reply(message,"Hello there, let's set you up!" );
//     } else {
//       bot.reply(message,"You are set up" );
//     }
//   }
// });

controller.hears(['question me'], 'direct_message', function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message, function(err,convo) {

   convo.ask('There is awaiting code review, do you want to accept it? Y/N',[
     {
       pattern: bot.utterances.yes,
       callback: function(response,convo) {
         convo.say("When you're done reviewing type accept/decline/reconfirm");
         // do something else...
         convo.next();
       }
     },
     {
       pattern: bot.utterances.no,
       callback: function(response,convo) {
         convo.say('Oh... I sent this offer to another reviewer.');
         // do something else...
         convo.next();
       }
     }
   ]);
  })

});

// user needs reconfirmation of pull request
// +1
controller.hears(['reconfirm'],['direct_message','direct_mention','mention'],function(bot,message) {
 bot.reply(message,"Thank you for your work. Now I sent this review for confirmation.");
});

// user decline review of pull request
// 0
controller.hears(['decline'],['direct_message'],function(bot,message) {
 bot.reply(message,"Oh... I sent this offer to another reviewer.");
});

// user done review of pull request
// +2
controller.hears(['accept'],['direct_message'],function(bot,message) {
 bot.reply(message,"Thank you! You have 1 more point in your stats.");
});

function getJSON(options, onResult){
  var prot = options.port == 443 ? https : http;
  var req = prot.request(options, function(res){
    var output = '';
    console.log(options.host + ':' + res.statusCode);
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      output += chunk;
    });

    res.on('end', function() {
      var obj = JSON.parse(output);
      onResult(res.statusCode, obj);
    });
  });

  req.on('error', function(err) {
      //res.send('error: ' + err.message);
  });

  req.end();
};
