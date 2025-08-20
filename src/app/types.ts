export class FoodItem {
	name: string;
	calories: number;
	image_url?: string;

	constructor(name: string, calories: number, image_url?: string) {
		this.name = name;
		this.calories = calories;
		this.image_url = image_url;
	}
}
