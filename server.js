import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	collection,
	getDocs,
	where,
	query as firestoreQuery,
} from 'firebase/firestore';
dotenv.config();

const firebaseConfig = {
	apiKey: 'AIzaSyDboXwOVHlMhnmWL-T9KxiFelc1mUOqTOs',
	authDomain: 'calorieguessr-cb8c0.firebaseapp.com',
	projectId: 'calorieguessr-cb8c0',
	storageBucket: 'calorieguessr-cb8c0.firebasestorage.app',
	messagingSenderId: '445502022369',
	appId: '1:445502022369:web:de96714d352bb4c3398da0',
	measurementId: 'G-S1W7K59ZT2',
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
const port = 3001;

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;
const FATSECRET_INIT_URL = 'https://oauth.fatsecret.com/connect/token';
let FATSSECRET_ACCESS_TOKEN = null;

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

app.use(
	cors({
		origin: 'http://localhost:3000',
		optionsSuccessStatus: 200,
	})
);

app.use(json());

async function initApi() {
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
			throw new Error('Failed to fetch data from CalorieNinjas API');
		}
		const data = await response.json();
		FATSSECRET_ACCESS_TOKEN = data.access_token;
		console.log('ACCESS TOKEN: ', FATSSECRET_ACCESS_TOKEN);
		return {
			access_token: data.access_token,
			expires_in: data.expires_in,
		};
	} catch (error) {
		console.error('Error initializing API:', error);
		throw error;
	}
}
initApi();

app.get('/api/init', async (req, res) => {
	const jsonResult = await initApi();
	res.status(200).json(jsonResult);
});

app.get('/api/food/calories', async (req, res) => {
	const foodName = req.query.query;

	try {
		const body = new URLSearchParams({
			method: 'foods.search',
			search_expression: foodName,
			max_results: 1,
			format: 'json',
		}).toString();

		console.log('Fetching calories for ', foodName);

		const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Bearer ${FATSSECRET_ACCESS_TOKEN}`,
			},
			body: body,
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		const foodData = data.foods.food;
		res.json(foodData);
	} catch (error) {
		console.error('Error fetching calories:', error);
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/food/image', async (req, res) => {
	const foodName = req.query.query;

	try {
		console.log('Fetching image for ', foodName);

		const response = await fetch(
			`${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${foodName}&searchType=image&num=1`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch image from Google Search API');
		}

		const data = await response.json();
		const imageUrl = data.items?.[0]?.link;

		console.log('Image URL: ', imageUrl);

		res.json({ imageUrl });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
