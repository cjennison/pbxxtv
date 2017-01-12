var celebrations = [];

function getNextCelebration () {
	if (celebrations.length) {
		return celebrations.shift();
	}
}

function addCelebration (title, subtitle) {
	console.log("Pushed new celebration", title, subtitle)
	celebrations.push({
		title: title,
		subtitle: subtitle
	})
}




module.exports.getNextCelebration = getNextCelebration;
module.exports.addCelebration = addCelebration;