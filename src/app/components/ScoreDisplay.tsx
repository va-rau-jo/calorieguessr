import React from 'react';
import ScoreBubble from './ScoreBubble';

// Define the types for the props of the ScoreDisplay component.
// This is a core feature of TypeScript that provides type safety.
interface ScoreDisplayProps {
	score: number;
	pointsGained: number | null;
	scores: number[];
}

// The core component, now typed as a functional component that accepts ScoreDisplayProps.
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, pointsGained, scores }) => {
	const pointColor = pointsGained === 0 ? 'text-gray-200' : 'text-green-500';

	const shouldDisplayScores = scores.length > 0;

	return (
		<div className='flex flex-col justify-center items-center pt-2 font-mono'>
			<div className='flex align-top relative'>
				<div className='flex mr-2 py-2'>
					{pointsGained !== null && (
						<span className={`${pointColor} transition-opacity duration-300`}>
							+{Math.round(pointsGained)}
						</span>
					)}
				</div>
				<div className='flex flex-col'>
					<span className='px-4 py-2 bg-gray-800 rounded-lg text-white'>
						Score: {Math.round(score)}
					</span>
					{shouldDisplayScores ? (
						<div className='mt-2 flex justify-center space-x-2 text-sm'>
							{scores.map((_, index) => (
								<ScoreBubble key={index} index={index} scores={scores} />
							))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default ScoreDisplay;
