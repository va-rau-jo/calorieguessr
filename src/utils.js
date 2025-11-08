export function dateToHyphenated(dateString) {
	return dateString.replace(/_/g, '-');
}

export function dateToUnderscore(dateString) {
	return dateString.replace(/-/g, '_');
}

export function getTodaysDateString() {
	const today = new Date(
		new Date().toLocaleString('en-US', {
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		})
	);
	return dateToUnderscore(today.toISOString().split('T')[0]);
}

/**
 * Parse calories from JSON data
 * @param jsonData - JSON data containing food description.
 * @returns Calories as a number
 */
export function parseCaloriesFromJson(jsonData) {
	const desc = jsonData['food_description'];
	console.log(desc);
	const match = desc.match(/Calories:\s*(\d+)/);
	let calories = match ? parseInt(match[1], 10) : 0;

	const serving = desc.split('Calories')[0];
	if (serving) {
		const fraction = serving.split('Per')[1].trim();
		const multiplier = parseInt(fraction.split('/')[1], 10);
		if (!isNaN(multiplier)) {
			calories *= multiplier;
		}
	}
	return calories;
}
