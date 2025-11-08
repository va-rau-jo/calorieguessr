import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;
const FATSECRET_INIT_URL = 'https://oauth.fatsecret.com/connect/token';
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

let FATSECRET_ACCESS_TOKEN = null;

/**
 * Initialize FatSecret API and get access token
 * @returns {Promise<object>} - Object containing access token and expires_in
 */
async function initFatSecretApi() {
	const requestBody = 'grant_type=client_credentials&scope=basic';
	const credentials = Buffer.from(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`).toString(
		'base64'
	);

	try {
		const response = await fetch(`${FATSECRET_INIT_URL}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${credentials}`,
			},
			body: requestBody,
		});

		if (!response.ok) {
			throw new Error('Failed to fetch access token from FatSecret API');
		}
		const data = await response.json();
		FATSECRET_ACCESS_TOKEN = data.access_token;
		return {
			access_token: data.access_token,
			expires_in: data.expires_in,
		};
	} catch (error) {
		console.error('Error initializing FatSecret API:', error);
		throw error;
	}
}

/**
 * Get raw food data from FatSecret API (used by server.js)
 * @param {string} foodName - Name of the food to search for
 * @returns {Promise<object|null>} - Raw food data object, or null if not found
 */
async function getFoodDataFromFatSecret(foodName) {
	if (!FATSECRET_ACCESS_TOKEN) {
		await initFatSecretApi();
	}

	// For testing

	// return JSON.parse(`{
	// 	"brand_name": "Burger King",
	// 	"food_description": "Per 1 serving - Calories: 670kcal | Fat: 41.00g | Carbs: 54.00g | Protein: 31.50g",
	// 	"food_id": "68444864",
	// 	"food_name": "Whopper",
	// 	"food_type": "Brand",
	// 	"food_url": "https://foods.fatsecret.com/calories-nutrition/burger-king/whopper"
	// }`);

	try {
		const body = new URLSearchParams({
			method: 'foods.search',
			search_expression: foodName,
			max_results: 1,
			format: 'json',
		}).toString();

		const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Bearer ${FATSECRET_ACCESS_TOKEN}`,
			},
			body: body,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log(data);
		return data.foods?.food || null;
	} catch (error) {
		console.error(`Error fetching food data for ${foodName}:`, error);
		throw error;
	}
}

/**
 * Get image URL for a food item from Google Search API
 * @param {string} foodName - Name of the food to search for
 * @returns {Promise<string|null>} - Image URL, or null if not found
 */
async function getImageFromGoogle(foodName) {
	try {
		const response = await fetch(
			`${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
				foodName
			)}&searchType=image&num=5`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch image from Google Search API');
		}

		const data = await response.json();
		const imageUrl =
			data.items?.find((item) => item.link.match(/\.(jpg|png|jpeg|webp)$/i))?.link ||
			data.items?.[0]?.link;

		return imageUrl || null;
	} catch (error) {
		console.error(`Error fetching image for ${foodName}:`, error);
		return null;
	}
}

export { initFatSecretApi, getFoodDataFromFatSecret, getImageFromGoogle };
