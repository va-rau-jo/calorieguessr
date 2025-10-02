/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/navigation';
import { DailyFood, FoodItem, mapFirebaseFoodItem } from '../types';
import { dateToHyphenated } from '../utils';
import { getScoresFromCookie } from '../components/CookieManager';
import ScoreBubble from '../components/ScoreBubble';

// Represents a past game with its date, items, and scores (if available).
type PastGame = {
	date: string;
	items: FoodItem[];
	scores: number[] | null;
};

export default function PastGamesPage() {
	const [pastGames, setPastGames] = useState<PastGame[]>([]);
	const router = useRouter();

	useEffect(() => {
		const fetchDates = async () => {
			try {
				const dailyFoodsRef = collection(db, 'dailyFoods');
				const q = query(dailyFoodsRef, orderBy('__name__', 'desc'));
				const querySnapshot = await getDocs(q);

				const pastGames: PastGame[] = [];
				querySnapshot.forEach((doc) => {
					const underscoreDate = doc.id;
					const scores = getScoresFromCookie(underscoreDate);
					pastGames.push({
						date: underscoreDate,
						items: doc
							.data()
							.foods.map((item: { name: string; calories: number; imageUrl: string }) =>
								mapFirebaseFoodItem(item)
							),
						scores: scores,
					});
				});
				setPastGames(pastGames);

				console.log('PAST GAMES');
				console.log(pastGames);
			} catch (error) {
				console.error('Error fetching past games:', error);
			}
		};

		fetchDates();
	}, []);

	const handleDateClick = (date: string) => {
		router.push(`/play?date=${date}`);
	};

	return (
		<div className='container mx-auto px-4 py-8'>
			<h1 className='text-3xl font-bold mb-6'>Past Games</h1>
			<div className='flex flex-col items-center space-y-2'>
				{pastGames.map((game) => (
					<div
						key={game.date}
						onClick={!game.scores ? () => handleDateClick(game.date) : undefined}
						className='w-1/2 flex p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors'
					>
						<div className='flex flex-col space-y-2 justify-center'>
							<p className='text-black text-lg'>{dateToHyphenated(game.date)}</p>
							{game.scores && (
								<p className='text-sm text-gray-500'>
									Total Score: {game.scores.reduce((acc, curr) => acc + curr, 0)}
								</p>
							)}
							{game.scores && game.scores.length != 5 ? (
								<button
									onClick={() => handleDateClick(game.date)}
									className='w-fit px-4 py-2 bg-blue-700/75 text-white text-sm rounded-lg cursor-pointer'
								>
									Continue
								</button>
							) : null}
						</div>
						<div className='flex flex-1 space-x-4 items-center justify-center'>
							{game.scores ? (
								game.scores.map((s, i) => (
									<div key={i} className='flex flex-col items-center'>
										<img
											src={game.items[i].imageUrl}
											alt={game.items[i].name}
											className='border border-black border-2 w-24 h-24 object-cover rounded-lg mb-2'
										/>
										<ScoreBubble index={i} scores={game.scores!} />
									</div>
								))
							) : (
								<div>
									<button
										onClick={() => handleDateClick(game.date)}
										className='px-4 py-2 bg-blue-700 text-white rounded-lg cursor-pointer'
									>
										Play!
									</button>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
