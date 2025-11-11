/**
 * Generate daily game data and upload to Firebase
 *
 * To run this script:
 * 1. Set up the Gemini API key in the .env file
 * 2. Run the script: node generate_daily_game.js
 */

import { initializeApp } from 'firebase/app';
import { collection, getFirestore, doc, getDocs, setDoc } from 'firebase/firestore';
import { initFatSecretApi, getFoodDataFromFatSecret, getImageFromGoogle } from './api_utils.js';
import { generateContent } from './gemini_server.js';
import { getTodaysDateString, parseCaloriesFromJson } from '../utils.js';
import admin from 'firebase-admin';
import * as fs from 'fs';

// Firebase configuration (copied from src/app/firebase/config.ts)
const firebaseConfig = {
	apiKey: 'AIzaSyDboXwOVHlMhnmWL-T9KxiFelc1mUOqTOs',
	authDomain: 'calorieguessr-cb8c0.firebaseapp.com',
	projectId: 'calorieguessr-cb8c0',
	storageBucket: 'calorieguessr-cb8c0.firebasestorage.app',
	messagingSenderId: '445502022369',
	appId: '1:445502022369:web:de96714d352bb4c3398da0',
	measurementId: 'G-S1W7K59ZT2',
};

// Number of food items to generate per game
const FOODS_PER_GAME = 5;

// Dummy processed foods for testing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DUMMY_PROCESSED_FOODS_FOR_UPLOAD = [
	{
		name: "McDonald's Quarter Pounder with Cheese",
		calories: 670,
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/c/ce/McDonald%27s_Quarter_Pounder_with_Cheese%2C_United_States.jpg',
	},
	{
		name: 'Burger King Whopper',
		calories: 670,
		imageUrl:
			'https://cdn.prod.website-files.com/631b4b4e277091ef01450237/65947cd2a2c28c35b5ca6fb1_Whopper%20w%20Cheese.png',
	},
	{
		name: 'Taco Bell Crunchwrap Supreme',
		calories: 670,
		imageUrl: 'https://www.tacobell.com/images/22362_crunchwrap_supreme_640x650.jpg',
	},
	{
		name: 'Chick-fil-A Chicken Sandwich',
		calories: 670,
		imageUrl: 'https://www.cfacdn.com/img/order/menu/Online/Entrees/Jul19_CFASandwich_pdp.png',
	},
	{
		name: 'Starbucks Bacon, Gouda & Egg Breakfast Sandwich',
		calories: 670,
		imageUrl:
			'https://www.stetted.com/wp-content/uploads/2014/04/Starbucks-Breakfast-Sandwich-Image.jpg',
	},
];

/**
 * Placeholder function to generate food names using an LLM
 * @param {number} count - Number of food names to generate
 * @param {string[]} foodNames - List of previously generated food names to avoid duplicates
 * @returns {Promise<string[]>} - Array of generated food names
 */
async function generateFoodNames(count, foodNames) {
	console.log(`Generating ${count} food names, skipping ${foodNames.length} previous foods.`);

	const foodListPlaceholder = '{food_list}';

	let prompt = `Your task is to generate a list of ${count} different food items from random fast food restaurants.
    This will be used for a calorie guessing game. Ensure the food name is specific enough to have accurate calorie estimates.
	Examples: "Domino's Medium Pepperoni Pizza", "McDonald's Big Mac", "Wendy's Frosty".
	Do not include any other text or formatting.
	You should not use any previously named foods in this list: "{food_list}"
	Return only the food names, one per line, without any additional text or formatting.`;

	prompt = prompt.replace(foodListPlaceholder, foodNames.join(', '));
	const modelOutput = await generateContent(prompt);
	// 	const modelOutput = `McDonald's Quarter Pounder with Cheese
	// Burger King Whopper
	// Taco Bell Crunchwrap Supreme
	// Chick-fil-A Chicken Sandwich
	// Starbucks Bacon, Gouda & Egg Breakfast Sandwich
	// `;
	let foods = modelOutput.trim().split('\n');
	if (foods.length != 5) {
		throw Error('Expected 5 food items, got ' + foods.length);
	}
	return foods;
}

/**
 * Process a single food item: get calories and image
 * @param {string} foodName - Name of the food item to process
 * @returns {Promise<object|null>} - Object containing food name, calories, and image URL, or null if failed
 */
async function processFoodItem(foodName) {
	const foodData = await getFoodDataFromFatSecret(foodName);
	if (foodData === null) {
		console.log(`Failed to get calories for ${foodName}, skipping...`);
		return null;
	}
	const calories = parseCaloriesFromJson(foodData);

	// Get image from Google
	console.log(`Fetching image for: ${foodName}`);
	const imageUrl = await getImageFromGoogle(foodName);

	if (!imageUrl) {
		console.log(`Warning: No image found for ${foodName}, but continuing...`);
	}

	return {
		name: foodName,
		calories: calories,
		imageUrl: imageUrl || '',
	};
}

/**
 * Upload daily game data to Firebase.
 *
 * @param {admin.FirebaseFirestore} db - The Firestore database instance.
 * @param {object[]} foods - Array of food items to upload, containing name,
 *  calories, and imageUrl.
 * @param {string} date - The date for the daily game in 'YYYY-MM-DD' format.
 */
async function uploadToFirebase(db, foods, date) {
	console.log('Uploading to Firebase for date:', date);
	try {
		// Filter out null items (failed to fetch)
		const validFoods = foods.filter((food) => food !== null && food.calories !== null);

		if (validFoods.length === 0) {
			console.log('No valid foods to upload');
			return;
		}

		const foodItemsBatch = db.batch();
		// Add each food item to the batch
		await Promise.all(
			validFoods.map(async (item) => {
				const itemName = item.name.toLowerCase();
				const foodDocRef = db.collection('foodItems').doc(itemName);

				// Check if item exists already
				const docSnapshot = await foodDocRef.get();
				if (!docSnapshot.exists) {
					foodItemsBatch.set(foodDocRef, item);
				} else {
					console.log(`Food item ${itemName} already exists in Firebase, skipping...`);
				}
			})
		);

		// Daily food data will use the same firebase food objects
		const dailyFoodData = { foods: validFoods };
		const docRef = db.collection('dailyFoods').doc(date);

		// Commit changes
		await Promise.all([foodItemsBatch.commit(), docRef.set(dailyFoodData)]);
		console.log(`\nSuccessfully uploaded daily game for ${date} with ${validFoods.length} foods`);
	} catch (error) {
		console.error('Error uploading to Firebase:', error);
		throw error;
	}
}

/**
 * Fetch all food items from Firebase.
 *
 * @param {FirebaseFirestore} db - The Firestore database instance.
 * @returns {Promise<string[]>} - Array of food item names.
 */
async function fetchFirebaseFoods(db) {
	const foodItemsSnapshot = await getDocs(collection(db, 'foodItems'));
	const firebaseFoods = [];
	foodItemsSnapshot.forEach((docSnap) => {
		const data = docSnap.data();
		firebaseFoods.push(data.name);
	});
	return firebaseFoods;
}

/**
 * Initialize Firebase Admin SDK.
 *
 * @returns {FirebaseFirestore} - Firestore database instance.
 */
async function initFirebaseApi() {
	// Service account path for Firebase Admin SDK
	const serviceAccountPath = './src/server/serviceAccountKey.json';
	try {
		if (!fs.existsSync(serviceAccountPath)) {
			throw new Error(
				`Service account file not found at: ${serviceAccountPath}. Please download it from the Firebase Console.`
			);
		}
		const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
		});

		console.log('Firebase Admin SDK initialized successfully.');
		return admin.firestore();
	} catch (error) {
		console.error('Failed to initialize Firebase Admin SDK:', error.message);
		process.exit(1);
	}
}

/**
 * Main function to generate daily game
 *
 * Steps:
 * 1. Initialize Firebase API
 * 2. Initialize FatSecret API and Firebase Admin SDK in parallel
 * 3. Fetch foods from firebase
 * 4. Generate food names using LLM
 * 5. Process each food item (get calories and images) in parallel
 * 6. Upload daily game data to Firebase
 */
async function generateDailyGame() {
	console.log('Starting daily game generation...\n');

	// Step 0: Initialize Firebase API
	const app = initializeApp(firebaseConfig);
	const readOnlyDb = getFirestore(app);

	// Step 1: Initialize FatSecret API and Firebase Admin SDK in parallel
	const [, adminDb] = await Promise.all([initFatSecretApi(), initFirebaseApi()]);

	// Step 2: Fetch foods from firebase
	const firebaseFoods = await fetchFirebaseFoods(readOnlyDb);
	console.log(`Fetched ${firebaseFoods.length} foods from Firebase`);

	// Step 3: Generate food names using LLM
	const foodNames = await generateFoodNames(FOODS_PER_GAME, firebaseFoods);
	console.log(`Generated ${foodNames.length} food names: ${foodNames.join('\n')}\n`);

	// Step 4: Process each food item (get calories and images) in parallel
	const processedFoods = await Promise.all(foodNames.map((foodName) => processFoodItem(foodName)));
	console.log(processedFoods);

	// Step 5: Upload generated food names, fetched images, and calories to Firebase
	const date = getTodaysDateString();
	await uploadToFirebase(adminDb, processedFoods, date);

	process.exit(0);
}

generateDailyGame();
