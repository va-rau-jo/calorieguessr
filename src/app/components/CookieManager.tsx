import { COOKIE_NAME_SCORE } from '../constants';

// Function to set a cookie
function _setCookie(name: string, value: string, days: number) {
	let expires = '';
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// Function to get a cookie
function _getCookie(name: string): string | null {
	const nameEQ = name + '=';
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

/**
 * Prints all accessible cookies to the console as key/value pairs.
 * Note: Will not show HttpOnly cookies.
 */
export function printAllCookies(): void {
	const cookieString: string = document.cookie;

	if (!cookieString) {
		console.log('No cookies found for the current page/path.');
		return;
	}
	// 2. Split the string into individual cookie entries
	// The entries are separated by a semicolon and a space (; )
	const cookies: string[] = cookieString.split(';');

	cookies.forEach((cookie) => {
		const trimmedCookie = cookie.trim();
		// Split the cookie into name and value at the first '=' sign
		const [name, value] = trimmedCookie.split('='); // The regex handles values that contain '='
		console.log(`Cookie Name: ${name.trim()} | Value: ${value ? value.trim() : ''}`);
	});
}

/**
 * Deletes all non-HttpOnly cookies accessible on the current path and domain.
 * NOTE: This function may not delete cookies set with a specific sub-path or domain.
 */
export function deleteAllCookies(): void {
	// 1. Get the raw cookie string and split it into an array of individual cookies
	// document.cookie returns a string like "name1=value1; name2=value2"
	const cookies = document.cookie.split(';');

	// 2. Loop through each cookie
	for (let i = 0; i < cookies.length; i++) {
		// Trim leading/trailing spaces and find the name part of the cookie
		// e.g., converts " name1=value1" to "name1"
		const cookie = cookies[i].trim();

		// Find the position of the first '=' to isolate the name
		const eqPos = cookie.indexOf('=');
		const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;

		// 3. Delete the cookie by setting its expiration to a time in the past
		// The key to deletion is: name=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/
		// We set max-age=0 and path=/ for the broadest deletion attempt.
		document.cookie = `${name}=; Max-Age=0; path=/;`;
	}
}

/**
 * Sets a cookie with the scores for the given date string.
 * @param scores - The array of scores to be stored in the cookie.
 * @param dateString - The date string in the format 'YYYY-MM-DD'.
 */
export function setScoresCookie(scores: number[], dateString: string) {
	const cookieValue = JSON.stringify({ scores: scores, date: dateString });
	const cookieName = COOKIE_NAME_SCORE + '_' + dateString;
	_setCookie(cookieName, cookieValue, 1);
}

/**
 * Retrieves the scores for the given date string from the cookie.
 * @param dateString - The date string in the format 'YYYY-MM-DD'.
 * @returns The array of scores if the cookie exists for the given date, otherwise null.
 */
export function getScoresFromCookie(underscoreDate: string): number[] | null {
	const cookieName = COOKIE_NAME_SCORE + '_' + underscoreDate;
	const cookieValue = _getCookie(cookieName);
	if (cookieValue) {
		return JSON.parse(cookieValue).scores;
	}
	return null;
}
