var celebrations = [];

function getNextCelebration () {
	if (celebrations.length) {
		return celebrations.shift();
	}
}

function addCelebration (title, subtitle, music) {
	console.log("Pushed new celebration", title, subtitle, music)
	celebrations.push({
		title: title,
		subtitle: subtitle,
		music: music
	})
}




module.exports.getNextCelebration = getNextCelebration;
module.exports.addCelebration = addCelebration;