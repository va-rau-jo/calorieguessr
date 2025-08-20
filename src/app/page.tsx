'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// A simple interface to define the structure of our food item data.
// This is a good practice for type safety in TypeScript.
interface FoodItem {
	name: string;
	calories: number;
	image_url: string;
}

// A static list of food items to be used for the quiz.
const fastFoodItems = [
	'Dominos Medium Pepperoni Pizza',
	'Chick-Fil-A Chicken Sandwich',
	'Mcdonalds Big Mac',
	'In-n-Out Animal Style Burger',
	'Mcdonalds 20 Piece Chicken Mcnuggets',
];

export default function Home() {
	const [gameStarted, setGameStarted] = useState(false);
	const [questions, setQuestions] = useState<FoodItem[]>([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userGuess, setUserGuess] = useState('');
	const [score, setScore] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pointsGained, setPointsGained] = useState<number | null>(null);
	const [streak, setStreak] = useState<boolean[]>([]); // Tracks correct/incorrect guesses for the streak display
	const [showFinalScore, setShowFinalScore] = useState(false);
	const [popupError, setPopupError] = useState<string | null>(null);

	// Effect to manage the fading of the pop-up error message.
	useEffect(() => {
		if (popupError) {
			const timer = setTimeout(() => {
				setPopupError(null);
			}, 3000); // Pop-up will disappear after 3 seconds.
			return () => clearTimeout(timer);
		}
	}, [popupError]);

	// Effect to handle the score animation.
	useEffect(() => {
		if (pointsGained === null) {
			return;
		}

		const duration = 1000; // Animation duration in ms
		const incrementInterval = 20; // Update every 20ms
		const totalIncrements = duration / incrementInterval;
		const pointsPerIncrement = pointsGained / totalIncrements;

		let currentIncrement = 0;
		const animationInterval = setInterval(() => {
			currentIncrement++;
			setScore((prevScore) => {
				const newScore = prevScore + pointsPerIncrement;
				console.log(newScore);
				return currentIncrement >= totalIncrements
					? Math.round(prevScore + pointsGained)
					: newScore;
			});
			setPointsGained((prevPoints) => prevPoints! - pointsPerIncrement);

			if (currentIncrement >= totalIncrements) {
				clearInterval(animationInterval);
				setPointsGained(null); // Hide the gained points display
			}
		}, incrementInterval);

		return () => clearInterval(animationInterval);
	}, [pointsGained]);

	// Function to start the game by fetching data.
	const startGame = async () => {
		setGameStarted(true);
		setLoading(true);
		setShowFinalScore(false);
		setError(null);

		try {
			console.log('INITIALIZING FOOD API');
			// Initialize the API (if necessary for the backend)
			const initResponse = await fetch(`http://localhost:3001/api/init`);
			if (!initResponse.ok) {
				throw new Error('Failed to initialize food API.');
			}

			// Fetch calories and images for each fast food item.
			const questionsWithImages = await Promise.all(
				fastFoodItems.map(async (item) => {
					// Fetch calorie information
					const calorieResponse = await fetch(
						`http://localhost:3001/api/food/calories?query=${item}`
					);
					const calorieData = await calorieResponse.json();
					const desc = calorieData['food_description'];

					// Parse the calorie value from the description.
					const match = desc.match(/Calories:\s*(\d+)/);
					const calories = match ? parseInt(match[1], 10) : 0;

					// Fetch the image URL
					const imageResponse = await fetch(`http://localhost:3001/api/food/image?query=${item}`);
					const imageData = await imageResponse.json();

					return {
						name: item,
						calories: calories,
						image_url: imageData.imageUrl,
					};
				})
			);

			setQuestions(questionsWithImages);
			setCurrentQuestionIndex(0);
			setScore(0);
			setStreak([]);
		} catch (err) {
			console.error(err);
			setError('Failed to load questions. Please ensure the local server is running.');
		} finally {
			setLoading(false);
		}
	};

	// Function to handle the user's guess.
	const handleGuess = () => {
		if (!userGuess) {
			setPopupError('Please enter a value.');
			return;
		}

		const guess = parseInt(userGuess, 10);
		if (isNaN(guess)) {
			setPopupError('Please enter a valid number.');
			return;
		}

		const actual = questions[currentQuestionIndex].calories;
		const points = Math.max(0, 1000 - Math.abs(actual - guess));

		// The score will be updated by the useEffect, so just set the points here
		setPointsGained(points);

		// Update streak and show answer screen
		const isCorrect = points > 900;
		setStreak([...streak, isCorrect]);
		setShowAnswer(true);
	};

	// Function to move to the next question or end the game.
	const nextQuestion = () => {
		setShowAnswer(false);
		setUserGuess('');
		setPointsGained(null);
		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		} else {
			// End of quiz, show the final score screen.
			setShowFinalScore(true);
			setGameStarted(false);
		}
	};

	// Conditional rendering for the different game states.
	if (!gameStarted && !showFinalScore) {
		return (
			<main className='flex min-h-screen flex-col items-center justify-center p-24'>
				<h1 className='text-4xl font-bold mb-8'>CalorieGuessr</h1>
				<button
					onClick={startGame}
					className='px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors'
				>
					Start Game
				</button>
			</main>
		);
	}

	if (loading) {
		return (
			<main className='flex min-h-screen flex-col items-center justify-center p-24'>
				Loading...
			</main>
		);
	}

	if (error) {
		return (
			<main className='flex min-h-screen flex-col items-center justify-center p-24'>
				<p className='text-red-500 mb-4'>{error}</p>
				<button
					onClick={startGame}
					className='px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors'
				>
					Try Again
				</button>
			</main>
		);
	}

	if (showFinalScore) {
		return (
			<main className='flex min-h-screen flex-col items-center justify-center p-24'>
				<h1 className='text-4xl font-bold mb-8'>Quiz Complete!</h1>
				<h2 className='text-2xl mb-4'>Your final score is: {Math.round(score)}</h2>
				<button
					onClick={() => {
						setShowFinalScore(false);
						setGameStarted(false);
						setQuestions([]);
						setCurrentQuestionIndex(0);
						setScore(0);
						setStreak([]);
					}}
					className='px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-700 transition-colors'
				>
					Play Again
				</button>
			</main>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];

	return (
		<main className='flex min-h-screen flex-col items-center justify-between p-24'>
			{/* Top section: Score and Question Number */}
			<div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex'>
				{/* Score in the top left */}
				<div className='fixed left-8 top-8 flex justify-center pb-6 pt-8'>
					<span className='px-4 py-2 bg-gray-800 rounded-lg text-white'>
						Score: {Math.round(score)}
					</span>
					{pointsGained !== null && (
						<span className='ml-2 text-green-500 transition-opacity duration-300'>
							+{Math.round(pointsGained)}
						</span>
					)}
				</div>
				{/* Question number in the top middle */}
				<div className='fixed top-8 left-1/2 -translate-x-1/2 flex justify-center pb-6 pt-8 text-black dark:text-white'>
					Question {currentQuestionIndex + 1} of {questions.length}
				</div>
			</div>

			{/* Main content section: Question and Image */}
			<div className="relative flex flex-col place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
				<h2 className='text-2xl font-semibold mb-4'>{currentQuestion.name}</h2>
				{currentQuestion.image_url && (
					<Image
						className='border-4 border-gray-400 rounded-lg dark:invert'
						src={currentQuestion.image_url}
						alt={currentQuestion.name}
						width={180}
						height={180}
						priority
					/>
				)}
			</div>

			{/* Bottom section: Guessing input and controls */}
			<div className='mt-8 mb-32 flex justify-center w-full'>
				{!showAnswer ? (
					<div className='flex flex-col items-center'>
						{/* Input and Guess Button */}
						<input
							type='number'
							value={userGuess}
							onChange={(e) => setUserGuess(e.target.value)}
							className='px-4 py-2 border rounded text-black'
							placeholder='Enter your guess'
						/>
						<button
							onClick={handleGuess}
							className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Guess
						</button>
						{/* Streak display */}
						<div className='mt-4 flex space-x-2'>
							{streak.map((isCorrect, index) => (
								<span key={index} className='text-xl'>
									{isCorrect ? '✅' : '❌'}
								</span>
							))}
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center'>
						<div>
							<p>Your Answer: {userGuess}</p>
						</div>
						<div>
							<p>Correct Answer: {currentQuestion.calories}</p>
						</div>
						<button
							onClick={nextQuestion}
							className='mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
						>
							Next
						</button>
					</div>
				)}
			</div>
			{/* Pop-up error message */}
			{popupError && (
				<div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-center px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-500'>
					{popupError}
				</div>
			)}
		</main>
	);
}
