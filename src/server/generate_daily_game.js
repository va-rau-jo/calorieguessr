import { generateDailyGame } from './generate_daily_game_lib.js';

generateDailyGame().then(() => {
	process.exit(0);
});
