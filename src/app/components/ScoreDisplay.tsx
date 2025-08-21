import React from 'react';

// Define the types for the props of the ScoreDisplay component.
// This is a core feature of TypeScript that provides type safety.
interface ScoreDisplayProps {
	score: number;
	pointsGained: number | null;
}

// The core component, now typed as a functional component that accepts ScoreDisplayProps.
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, pointsGained }) => {
	const pointColor = pointsGained === 0 ? 'text-gray-200' : 'text-green-500';

	return (
		<div className='fixed left-4 top-4 flex justify-center pt-2'>
			<span className='px-4 py-2 bg-gray-800 rounded-lg text-white'>
				Score: {Math.round(score)}
			</span>
			{pointsGained !== null && (
				<span className={`my-auto ml-2 ${pointColor} transition-opacity duration-300`}>
					+{Math.round(pointsGained)}
				</span>
			)}
		</div>
	);
};

export default ScoreDisplay;
