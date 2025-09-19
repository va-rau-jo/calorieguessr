export interface FoodItem {
	name: string;
	calories: number | null;
	imageUrl?: string;
}

export interface DailyFood {
	date: string;
	items: FoodItem[];
	// Whether the daily food has been updated. Existing daily foods that are not
	// updated don't get saved to Firebase.
	hasBeenUpdated: boolean;
}
