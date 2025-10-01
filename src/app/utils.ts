export function dateToHyphenated(dateString: string): string {
	return dateString.replace(/_/g, '-');
}

export function dateToUnderscore(dateString: string): string {
	return dateString.replace(/-/g, '_');
}

export function getTodaysDateString(): string {
	const today = new Date(
		new Date().toLocaleString('en-US', {
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		})
	);
	return dateToUnderscore(today.toISOString().split('T')[0]);
}
