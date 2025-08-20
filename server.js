import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = 3001;

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;
const FATSECRET_INIT_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_SEARCH_URL =
	'https://platform.fatsecret.com/rest/foods/search/v1?search_expression=';
let FATSSECRET_ACCESS_TOKEN = null;

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

// Allow requests from the Next.js client
app.use(
	cors({
		origin: 'http://localhost:3000',
		optionsSuccessStatus: 200,
	})
);

app.use(json());

app.get('/api/init', async (req, res) => {
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
		res.status(200).json({
			access_token: data.access_token,
			expires_in: data.expires_in,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/food/calories', async (req, res) => {
	const { query } = req.query;
	const body = new URLSearchParams({
		method: 'foods.search',
		search_expression: query,
		max_results: 1,
		format: 'json',
	}).toString();

	console.log('Fetching calories for query: ', query);

	try {
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
		res.json(data.foods.food);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/food/image', async (req, res) => {
	const { query } = req.query;
	console.log(
		`${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${query}&searchType=image&num=1`
	);
	try {
		const response = await fetch(
			`${GOOGLE_SEARCH_API_URL}?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${query}&searchType=image&num=1`
		);
		if (!response.ok) {
			throw new Error('Failed to fetch image from Google Search API');
		}
		const data = await response.json();
		res.json({ imageUrl: data.items?.[0]?.link });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
