'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/navigation';
import { DailyFood, mapFirebaseFoodItem } from '../types';
import { dateToHyphenated } from '../utils';

export default function PastGamesPage() {
	const [pastGames, setPastGames] = useState<DailyFood[]>([]);
	const router = useRouter();

	useEffect(() => {
		const fetchDates = async () => {
			try {
				const dailyFoodsRef = collection(db, 'dailyFoods');
				const q = query(dailyFoodsRef, orderBy('__name__', 'desc'));
				const querySnapshot = await getDocs(q);

				const pastGames: DailyFood[] = [];
				querySnapshot.forEach((doc) => {
					pastGames.push({
						date: doc.id,
						items: doc
							.data()
							.foods.map((item: { name: string; calories: number; imageUrl: string }) =>
								mapFirebaseFoodItem(item)
							),
						hasBeenUpdated: false,
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
			<div className='space-y-2'>
				{pastGames.map((game) => (
					<div
						key={game.date}
						onClick={() => handleDateClick(game.date)}
						className='p-4 text-black bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors'
					>
						<p className='text-lg'>{dateToHyphenated(game.date)}</p>
					</div>
				))}
			</div>
		</div>
	);
}
