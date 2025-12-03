import express, { json } from 'express';
import cors from 'cors';
import { initFatSecretApi, getFoodDataFromFatSecret, getImageFromGoogle } from './api_utils.js';
import schedule from 'node-schedule';
import { generateDailyGame } from './generate_daily_game_lib.js';
const app = express();
const port = 3001;

app.use(
	cors({
		origin: 'http://localhost:3000',
		optionsSuccessStatus: 200,
	})
);

app.use(json());

// Initialize API on server start
initFatSecretApi().then(() => {
	console.log('FatSecret API initialized');
});

app.get('/api/init', async (_, res) => {
	try {
		const jsonResult = await initFatSecretApi();
		res.status(200).json(jsonResult);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get('/api/food/calories', async (req, res) => {
	const foodName = req.query.query;

	try {
		console.log('Fetching calories for ', foodName);
		const foodData = await getFoodDataFromFatSecret(foodName);
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
		const imageUrl = await getImageFromGoogle(foodName);
		res.json({ imageUrl });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);

	// Runs at the start of every day.
	schedule.scheduleJob('0 0 0 * * *', function () {
		// second, minute, hour, day, week, year
		// Schedule with '* * * * * *' to run every second
		generateDailyGame();
	});
});
