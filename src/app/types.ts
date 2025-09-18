export interface FoodItem {
	name: string;
	calories: number | null;
	imageUrl?: string;
}

export interface DailyFood {
	date: string;
	items: FoodItem[];
}
