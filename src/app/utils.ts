export function dateToHyphenated(dateString: string): string {
	return dateString.replace(/_/g, '-');
}

export function dateToUnderscore(dateString: string): string {
	return dateString.replace(/-/g, '_');
}
