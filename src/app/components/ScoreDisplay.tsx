import React from 'react';

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
	console.log(shouldDisplayScores);

	const getScoreColor = (score: number) => {
		// Starting gray (for score 0): RGB(50, 50, 50)
		const startRed = 50;
		const startGreen = 50;
		const startBlue = 50;

		// Ending dark green (for score 1000): RGB(0, 128, 0)
		const endRed = 0;
		const endGreen = 128;
		const endBlue = 0;

		// Calculate the score's proportion of the total range
		const proportion = score / 1000;

		// Linearly interpolate each color component
		const redValue = Math.floor(startRed + (endRed - startRed) * proportion);
		const greenValue = Math.floor(startGreen + (endGreen - startGreen) * proportion);
		const blueValue = Math.floor(startBlue + (endBlue - startBlue) * proportion);

		return `rgb(${redValue}, ${greenValue}, ${blueValue})`;
	};

	const scoreColors = scores.map((score) => getScoreColor(score));

	return (
		<div className='flex flex-col fixed left-4 top-2 flex justify-center items-center pt-2'>
			<div className='relative'>
				<span className='px-4 py-2 bg-gray-800 rounded-lg text-white'>
					Score: {Math.round(score)}
				</span>
				{pointsGained !== null && (
					<span className={`absolute my-auto ml-2 ${pointColor} transition-opacity duration-300`}>
						+{Math.round(pointsGained)}
					</span>
				)}
			</div>
			{shouldDisplayScores ? (
				<div className='mt-4 flex space-x-2 text-sm'>
					{scores.map((score, index) => (
						<span
							key={index}
							className='px-1 py-1 rounded-[1vw]'
							style={{ backgroundColor: scoreColors[index] }}
						>
							{score}
						</span>
					))}
				</div>
			) : null}
		</div>
	);
};

export default ScoreDisplay;
