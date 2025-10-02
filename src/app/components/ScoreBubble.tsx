interface ScoreBubbleProps {
	scores: number[];
	index: number;
}

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

export default function ScoreBubble({ scores, index }: ScoreBubbleProps) {
	const scoreColors = scores.map((score) => getScoreColor(score));
	const score = scores[index];
	return (
		<span
			key={index}
			className='px-1 py-1 rounded-[1vw] w-14 text-center'
			style={{ backgroundColor: scoreColors[index] }}
		>
			{score}
		</span>
	);
}
