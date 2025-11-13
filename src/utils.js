export function dateToHyphenated(dateString) {
	return dateString.replace(/_/g, '-');
}

export function stringToUnderscore(string) {
	return string.replace(/-/g, '_');
}

/**
 * Get today's date string in the format 'YYYY_MM_DD'
 * E.g. '2023_12_25'
 * @returns Today's date string
 */
export function getTodaysDateAsUnderscoreString() {
	const today = new Date(
		new Date().toLocaleString('en-US', {
			timeZone: 'America/Los_Angeles',
		})
	);
	const output = `${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
	return output;
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
