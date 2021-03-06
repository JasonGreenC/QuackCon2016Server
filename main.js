'use strict'

const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');
const SNS = new AWS.SNS({region: 'us-west-2'});

AWS.config.loadFromPath('./config.json');

console.log(AWS.config.credentials.get())



const iosAppArn = "arn:aws:sns:us-west-2:164008979560:app/APNS_SANDBOX/QuackCon2016"
const andrAppArn = ""
const errorStrings = {
	missingParam: 'MISSING_REQUIRED_PARAMETER',
	unknownTopic: 'UNKNOWN_TOPIC',
	unknownType: 'UNKNOWN_DEVICE_TYPE'
}

console.log(SNS.endpoint);

const server = new Hapi.Server();
server.connection({ port: 3000 });

var topics = {}
var counter = 18
var arraycount = -1
//var myVar = setInterval(function(){ publish() }, 1000);
var tutorialarray = [
"A first down means the team has advanced the ball 10 yards from its starting position. A team has four downs to move the football 10 yards.",
"",
"A touchdown occurs when the football reaches the endzone at the end of the field. This automatically grants the team 6 points. This will be followed by either a field goal attempt or a 2 point conversion attempt. ",
"The kick was blocked! This prevented the kicking team from getting an extra point."
]


server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply) {
		reply('Hello, world\n');
	}
});

function publish(message, topicArn, cb) {
	let isObject = (typeof message !== null && typeof message === 'object')

	var params = {
		Message: message,
		TopicArn: topicArn
	};
	if (isObject) {
		let wrapper = {
			'default': 'default',
			'APNS': JSON.stringify({'aps': {'content-available': 1, data: message}}),
			'APNS_SANDBOX': JSON.stringify({'aps': {'content-available': 1, data: message}})
		}
		params.MessageStructure = 'json';
		params.Message = JSON.stringify(message)
		params.Message = JSON.stringify(wrapper);
		
arraycount = arraycount + 1
console.log(counter);

	}

	SNS.publish(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
			if (cb) cb('Error publishing');
		}
		else {
			console.log(data);
			if (cb) cb('Message published');
		}
	});
}

server.route({
	method: 'POST',
	path: '/publish',
	handler: function(request, reply) {
		const query = request.query
		if (!query.topic) {
			var missing = [];
			if (!query.topic) missing.push('topic');

			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			reply(error);
			return;
		}

		const message = request.payload.message;
		publish(message, topics[query.topic].topicArn, function(message) {
			reply(message);
		});
		
	}
});

server.route({
	method: 'GET',
	path: '/register',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.token || !query.type) {
			var missing = [];
			if (!query.token) missing.push('token');
			if (!query.token) missing.push('type');

			const error = {
				error: errorStrings.missingParam,
				info: missing
			}
			reply(error);
			return;
		}

		let appArn;
		if (query.type === 'ios') {
			appArn = iosAppArn;
		}
		else if (query.type === 'android') {
			appArn = andrAppArn;
		}
		else {
			const error = {
				error: errorStrings.unknownType,
				info: [query.type]
			};
			reply(error);
			return;
		}

		const params = {
			PlatformApplicationArn: appArn,
			Token: query.token
		};
		SNS.createPlatformEndpoint(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error registering device\n');
			}
			else {
				console.log(data);
				const response = {
					endpointArn: data.EndpointArn
				};
				reply(response);
			}
		});
	}
});

server.route({
	method: 'POST',
	path: '/create',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.name || !query.display_name) {
			var missing = [];
			if (!query.name) missing.push('name');
			if (!query.display_name) missing.push('display_name');
			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			reply(error);
			return;
		}
		const topicName = query.name;
		const displayName = query.display_name;
		const params = { Name: topicName }
		SNS.createTopic(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error creating topic');
			}
			else {
				console.log(data);
				console.log(data.TopicArn);
				topics[topicName] = { 
					topicArn: data.TopicArn,
					displayName: displayName
				}
				reply('Topic successfully created');
			}
		});
	}
});

server.route({
	method: 'DELETE',
	path: '/remove',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.topic) {
			var missing = []
			if (!query.topic) missing.push('topic');
			
			const error = {
				error: errorStrings.missingParam,
				info: missing
			};
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			reply(error)
			return;
		}

		const params = { TopicArn: topics[query.topic].topicArn };
		SNS.deleteTopic(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error deleting topic');
			}
			else {
				console.log(data);
				delete topics[query.topic];
				reply('Topic successfully deleted');
			}
		});
	}
});

server.route({
	method: 'POST',
	path: '/subscribe',
	handler: function(request, reply) {
		const query = request.query;
		if (!query.topic || !query.protocol || !query.endpointArn) {
			var missing = [];
			if (!query.topic) missing.push('topic');
			if (!query.protocol) missing.push('protocol');
			if (!query.endpointArn) missing.push('endpointArn');
			const error = {
				error: errorStrings.missingParam,
				info: missing
			}
			reply(error);
			return;
		}
		if (!topics[query.topic]) {
			const error = {
				error: errorStrings.unknownTopic,
				info: [query.topic]
			}
			reply(error);
			return;
		}

		const params = {
			Protocol: query.protocol,
			TopicArn: topics[query.topic].topicArn,
			Endpoint: query.endpointArn
		}
		SNS.subscribe(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
				reply('Error subscribing to topic');
			}
			else {
				console.log(data);
				if (data.SubscriptionArn) {
					reply({ subscriptionArn: data.SubscriptionArn });
				}
				else {
					reply({});
				}
			}
		});
	}
});

server.route({
	method: 'GET',
	path: '/topics',
	handler: function(request, reply) {
		reply(topics);
	}
});

server.start((err) => {
	if (err) {
		console.log(err);
		throw err;
	}

	console.log(`Server running at: ${server.info.uri}`);

	let data = {
		someData: "SOME DATA",
		otherData: "Other"
	};
	publish(data, "arn:aws:sns:us-west-2:164008979560:HapiTest");
});


var http = require("http");
var url = " http://api.sportradar.us/nfl-ot1/games/c8dc876a-099e-4e95-93dc-0eb143c6954f/pbp.json?api_key=6vgqj9xr6fqj2es2umvwcc35";

// get is a simple wrapper for request()
// which sets the http method to GET
var request = http.get(url, function (response) {
    // data is streamed in chunks from the server
    // so we have to handle the "data" event    
    var buffer = "", 
        data,
        route;

    response.on("data", function (chunk) {
        buffer += chunk;
    }); 

    response.on("end", function (err) {
        // finished transferring data
        // dump the raw data
       // console.log(buffer);
        console.log("\n");
       var data = JSON.parse(buffer);
       var teams = data.summary

        // extract the distance and time
        //console.log(data.summary)
       var hometeam = ("Home Team: " + teams.home.name);
       var awayteam = ("Away Team: " + teams.away.name);
      // var homescore =
       //var awayscore =
       var venue = ("Venue: " + teams.venue.name);
		var intervalID = setInterval(container, 15000);

		function container(){
		publish({
       		"hometeam": teams.home.name,
       		"awayteam": teams.away.name,
       		"homescore": data.periods[3].pbp[4].events[counter].home_points,
       		"awayscore": data.periods[3].pbp[4].events[counter].away_points,
       		"quarter": data.periods[3].number,
       		"playdesc": data.periods[3].pbp[4].events[counter].alt_description,
       		"possession": data.periods[3].pbp[4].events[counter].end_situation.possession.name,
       		"fieldside": data.periods[3].pbp[4].events[counter].end_situation.location.name,
       		"yardline": data.periods[3].pbp[4].events[counter].end_situation.location.yardline,
       		"tutorial":tutorialarray[arraycount],
       		"down": data.periods[3].pbp[4].events[counter].start_situation.down

       		//"tutialstring": "1st down means the other team gets the ball"

   }, "arn:aws:sns:us-west-2:164008979560:HapiTest")

			if(counter == 20){
			clearInterval(intervalID)
				}
			else(counter = counter + 1)
			console.log(arraycount)
			console.log(tutorialarray[arraycount])
	}
	intervalID

		console.log(data.periods[3].pbp[4].events[counter].alt_description)





      // publish(hometeam, "arn:aws:sns:us-west-2:164008979560:HapiTest")t
       //publish(awayteam, "arn:aws:sns:us-west-2:164008979560:HapiTest")
       //publish(venue, "arn:aws:sns:us-west-2:164008979560:HapiTest")
        
    }); 
}); 		



