export function dateToHyphenated(dateString: string): string {
	return dateString.replace(/_/g, '-');
}

export function dateToUnderscore(dateString: string): string {
	return dateString.replace(/-/g, '_');
}

// Function to set a cookie
export function setCookie(name: string, value: string, days: number) {
	let expires = '';
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// Function to get a cookie
export function getCookie(name: string): string | null {
	const nameEQ = name + '=';
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

// Function to delete a cookie
export function deleteCookie(name: string) {
	document.cookie = name + '=; Max-Age=-99999999;';
}
