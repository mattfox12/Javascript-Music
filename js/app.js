var midiPart;

var playPause = function(stop) {
	if (!midiPart) return; // exit if no music loaded

	console.log("Play("+stop+")");
	if (stop) {
		console.log("Stop");
		midiPart.stop();

		// show/hide buttons
		$('#playButton').removeClass('hidden');
		$('#stopButton').addClass('hidden');
	} else {
		if (midiPart.state === "started") {
			midiPart.stop();
		}
		console.log("Play");
		midiPart.start();

		// show/hide buttons
		$('#playButton').addClass('hidden');
		$('#stopButton').removeClass('hidden');
	}
};

var select_instrument = function(el) {
	var instrument = $(el).val();
	console.log("Instrument", instrument);
	switch (instrument) {
		case 'tom':
			currentSynth = tom;
			break;
		default:
			currentSynth = synth;
			break;
	}
}

var select_preload = function() {
	var data = $("#preload_list").val();

	switch (data) {
		case "0":
			$("#music_script").val(NewProject);
			break;
		case "1":
			$("#music_script").val(SimpleNotes);
			break;
		case "2":
			$("#music_script").val(Loops);
			break;
		case "3":
			$("#music_script").val(Functions);
			break;
		default:
			$("#music_script").val("");
			break;
	}

	$("#preload_list").val("");
};

var send_data = function() {
	var data = $("#music_script").val();
	if (!data || data == "") return; // do nothing if blank

	$.post("submit", { data: data, name: "script.js" }, function (midi) {
		console.log(midi);
		if (midi.error) return alert("Error in Javascript");

		$('#musicName').text(midi.header.name);
		$('#musicPlayer').removeClass('hidden');

		Tone.Transport.bpm.value = midi.header.bpm;
		Tone.Transport.timeSignature = midi.header.timeSignature;

		// pass in the note events from one of the tracks as the second argument to Tone.Part
		midiPart = new Tone.Part(function(time, note) {
			//use the events to play the synth
			console.log("Note!", note.name);
			currentSynth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
		}, midi.tracks[0].notes).start();

		// start the transport to hear the events
		Tone.Transport.start();

		playPause();
	});
};

var currentSynth;
var synth, tom;

window.onload = function() {
	tom = new Tone.MembraneSynth().toMaster();
	synth = new Tone.PolySynth(8, Tone.Synth, {
		"oscillator": {
			"type": "sine3"
		},
		"envelope": {
			"attack": 0.03,
			"decay": 0.1,
			"sustain": 0.9,
			"release": 0.1
		}
	}).toMaster();

	currentSynth = synth;

	// default with NewProject code
	$("#music_script").val(NewProject);

	// function playNote(time, event){
	// 	synth.triggerAttackRelease(event.name, event.duration, time, event.velocity);
	// }
};
