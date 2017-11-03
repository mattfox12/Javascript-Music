var http            = require("http");
var express         = require("express");
var bodyParser		= require('body-parser');
var _               = require('underscore');
var fs              = require('fs');
var exec 			= require('child_process').execSync;
var cors			= require("cors");
var MidiConvert     = require("midiconvert");

var config = {
	dir: __dirname,
	port: 3048
}

console.log("Config", config);

var app_service     = new express();
app_service.use(bodyParser.json());
app_service.use(bodyParser.urlencoded({
  limit: '50mb'
}));

app_service
.get('/tracks/*', function (req, res) {
	var tmp_file		= req.originalUrl.split('?');

	console.log("MIDI requested", tmp_file[0]);
  	fs.readFile(config.dir + tmp_file[0], 'binary', function(err, resp) {
  		if (err) console.log('Couldnt load MIDI', tmp_file);
		var midi = MidiConvert.parse(resp);
  		res.send(midi);
  	});
})
.get('/js/*', function (req, res) {
	var tmp_file		= req.originalUrl.split('?');

  	fs.readFile(config.dir + tmp_file[0], 'utf-8', function(err, resp) {
  		if (err) console.log('Couldnt load file', tmp_file);
  		res.send(resp);
  	});
})
.post('/submit', function (req, res) {
	// console.log("Request", req.body);
	var sent_data	= req.body;

	// save data to file
	fs.writeFileSync("tracks/"+sent_data.name, sent_data.data);

	var re = /\'([a-zA-z0-9]+.mid)\'/i;
	var found_name = sent_data.data.match(re);
	console.log(found_name[1]);

	// run node on the file
	try {
		exec("cd "+config.dir +"/tracks && node "+sent_data.name);
	} catch(err) {
		return res.json({error: err});
	}

	// return the json for the MIDI file created
	try {
		fs.readFile(config.dir + "/tracks/"+found_name[1], 'binary', function(err, resp) {
	  		if (err) console.log('Couldnt load MIDI', tmp_file);
			var midi = MidiConvert.parse(resp);
			midi.header.name = found_name[1];
			// test by sending same data back
	  		res.send(midi);
	  	});
	} catch(err) {
		return res.json({error: err});
	}
})
.use(cors())
.use(express.static(config.dir))
.use(function(res, req, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

http.createServer(app_service).listen(config.port);

console.log('Setup the App Server');
