/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/navigation';
import { FoodItem, Game, mapFirebaseFoodItem } from '../types';
import { dateToHyphenated } from '../../utils';
import { getGameFromCookie } from '../components/CookieManager';
import Button, { ButtonColor, ButtonRound } from '../components/Button';
import ScoreBubble from '../components/ScoreBubble';

// Represents a past game with its date, items, and scores (if available).
type PastGame = {
	date: string;
	items: FoodItem[];
	game: Game | null;
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
					const game = getGameFromCookie(underscoreDate);
					pastGames.push({
						date: underscoreDate,
						items: doc
							.data()
							.foods.map((item: { name: string; calories: number; imageUrl: string }) =>
								mapFirebaseFoodItem(item)
							),
						game: game,
					});
				});
				setPastGames(pastGames);
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
			<Button
				onClick={() => router.back()}
				round={ButtonRound.Large}
				additionalClassNames='absolute top-4 left-4'
			>
				← Back
			</Button>
			<h1 className='text-3xl text-center font-bold mb-6'>Past Games</h1>
			<div className='flex flex-col items-center space-y-2'>
				{pastGames.map((pastGame) => (
					<div
						key={pastGame.date}
						onClick={!pastGame.game ? () => handleDateClick(pastGame.date) : undefined}
						className='w-1/2 flex p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors'
					>
						<div className='flex flex-col space-y-2 justify-center'>
							<div className='w-40'>
								<p className='text-black text-lg'>{dateToHyphenated(pastGame.date)}</p>
							</div>
							{pastGame.game && (
								<p className='text-lg text-gray-500'>
									Total: {pastGame.game.scores.reduce((acc, curr) => acc + curr, 0)}
								</p>
							)}
							{pastGame.game && !pastGame.game.gameCompleted ? (
								<Button onClick={() => handleDateClick(pastGame.date)}>Continue</Button>
							) : null}
						</div>
						<div className='flex flex-1 space-x-4 items-center justify-center'>
							{pastGame.game ? (
								pastGame.game.scores.map((s, i) => (
									<div key={i} className='flex flex-col items-center'>
										<img
											src={pastGame.items[i].imageUrl}
											alt={pastGame.items[i].name}
											className='border border-black border-2 w-24 h-24 object-cover rounded-lg mb-2'
										/>
										<ScoreBubble index={i} scores={pastGame.game!.scores!} />
									</div>
								))
							) : (
								<div>
									<Button color={ButtonColor.Blue} onClick={() => handleDateClick(pastGame.date)}>
										Play!
									</Button>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
