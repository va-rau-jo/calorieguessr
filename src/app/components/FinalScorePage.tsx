/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { FoodItem } from '../types';
import ScoreBubble from './ScoreBubble';

interface FinalScorePageProps {
	score: number;
	scores: number[];
	questions: FoodItem[];
	backCallback: () => void;
}

export class FinalScorePage extends React.Component<FinalScorePageProps> {
	render() {
		const { score, scores, questions, backCallback } = this.props;

		return (
			<main className='flex w-full flex-col items-center justify-center p-24'>
				<h1 className='text-4xl font-bold mb-8'>Quiz Completed!</h1>
				<h2 className='text-2xl mb-4'>Your final score is: {Math.round(score)}</h2>
				<div className='flex w-full justify-center space-x-8'>
					{scores.map((s, i) => (
						<div key={i} className='flex flex-col items-center mb-4'>
							<img
								src={questions[i].imageUrl}
								alt={questions[i].name}
								className='w-32 h-32 object-cover rounded-lg mb-2'
							/>
							<ScoreBubble index={i} scores={scores} />
						</div>
					))}
				</div>
				<button
					onClick={backCallback}
					className='px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-700 transition-colors'
				>
					Back Home
				</button>
			</main>
		);
	}
}
