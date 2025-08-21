'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScoreDisplay from './components/ScoreDisplay';

interface FoodItem {
	name: string;
	calories: number;
	image_url: string;
}

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
	const [streak, setStreak] = useState<boolean[]>([]);
	const [showFinalScore, setShowFinalScore] = useState(false);
	const [popupError, setPopupError] = useState<string | null>(null);

	// --- Animation refs/state ---
	const animFrameRef = useRef<number | null>(null);
	const animStartRef = useRef<number | null>(null);
	const animInitialPointsRef = useRef<number>(0);
	const animStartScoreRef = useRef<number>(0);
	const startPointsAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const SCORE_ANIMATION_DURATION_MS = 1000;

	// Initialize game data on component mount
	useEffect(() => {
		const initializeGame = async () => {
			setLoading(true);
			try {
				const initResponse = await fetch(`http://localhost:3001/api/init`);
				if (!initResponse.ok) {
					throw new Error('Failed to initialize food API.');
				}

				const questionsWithImages = await Promise.all(
					fastFoodItems.map(async (item) => {
						const calorieResponse = await fetch(
							`http://localhost:3001/api/food/calories?query=${item}`
						);
						const calorieData = await calorieResponse.json();
						const desc = calorieData['food_description'] as string;
						const match = desc.match(/Calories:\s*(\d+)/);
						let calories = match ? parseInt(match[1], 10) : 0;

						const serving = desc.split('Calories')[0];
						if (serving) {
							const fraction = serving.split('Per')[1].trim();
							const multiplier = parseInt(fraction.split('/')[1], 10);
							if (!isNaN(multiplier)) {
								calories *= multiplier;
							}
						}

						const imageResponse = await fetch(`http://localhost:3001/api/food/image?query=${item}`);
						const imageData = await imageResponse.json();

						return {
							name: item,
							calories,
							image_url: imageData.imageUrl as string,
						};
					})
				);
				setQuestions(questionsWithImages);
			} catch (err) {
				console.error(err);
				setError('Failed to load questions. Please ensure the local server is running.');
			} finally {
				setLoading(false);
			}
		};
		initializeGame();
	}, []); // Empty dependency array means this runs once on mount

	// Clean up animation on unmount or when showAnswer toggles away
	useEffect(() => {
		return () => {
			if (animFrameRef.current !== null) {
				cancelAnimationFrame(animFrameRef.current);
				animFrameRef.current = null;
			}
		};
	}, []);

	// Pop-up fade
	useEffect(() => {
		if (popupError) {
			const t = setTimeout(() => setPopupError(null), 3000);
			return () => clearTimeout(t);
		}
	}, [popupError]);

	const startGame = async () => {
		if (!loading) {
			setGameStarted(true);
			setShowFinalScore(false);
			setCurrentQuestionIndex(0);
			setScore(0);
			setStreak([]);
		}
	};

	// Start the points/score animation (exactly 1000ms, linear)
	const startPointsAnimation = (initialPoints: number) => {
		// Guard: nothing to animate
		console.log('Starting animation');
		console.log(pointsGained);
		if (initialPoints === null || initialPoints <= 0) {
			// Ensure the UI reflects zero points added and unchanged score
			setPointsGained(null);
			return;
		}

		// Capture starting values once
		animInitialPointsRef.current = initialPoints;
		animStartScoreRef.current = score;
		animStartRef.current = null;

		// Cancel any previous animation before starting a new one
		if (animFrameRef.current !== null) {
			cancelAnimationFrame(animFrameRef.current);
			animFrameRef.current = null;
		}

		const tick = (now: number) => {
			if (animStartRef.current === null) animStartRef.current = now;
			const elapsed = now - animStartRef.current;
			const t = Math.min(elapsed / SCORE_ANIMATION_DURATION_MS, 1); // 0..1

			// Linear interpolation of remaining points
			const remaining = Math.round(animInitialPointsRef.current * (1 - t));
			const gained = animInitialPointsRef.current - remaining;

			// Update state atomically based on captured baselines
			setPointsGained(remaining);
			setScore(animStartScoreRef.current + gained);

			if (t < 1) {
				animFrameRef.current = requestAnimationFrame(tick);
			} else {
				// Ensure exact final values
				console.log('Stopping points gained');
				setTimeout(() => {
					setPointsGained(null);
				}, 1000);
				setScore(animStartScoreRef.current + animInitialPointsRef.current);
				animFrameRef.current = null;
			}
		};

		animFrameRef.current = requestAnimationFrame(tick);
	};

	// Handle the user's guess
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

		// Prepare streak & answer view first
		const isCorrect = points > 900;
		setStreak((s) => [...s, isCorrect]);
		setShowAnswer(true);

		// Initialize points (display starting value) and kick off animation
		console.log('setting points gained to ', points);
		setPointsGained(points);
		startPointsAnimationTimeoutRef.current = setTimeout(() => {
			startPointsAnimation(points);
		}, 1000);
	};

	const nextQuestion = () => {
		// Ensure any running animation is stopped
		if (animFrameRef.current !== null) {
			cancelAnimationFrame(animFrameRef.current);
			animFrameRef.current = null;
		}
		if (startPointsAnimationTimeoutRef.current !== null) {
			clearTimeout(startPointsAnimationTimeoutRef.current);
			startPointsAnimationTimeoutRef.current = null;
		}

		setShowAnswer(false);
		setUserGuess('');
		setScore((prevScore) => prevScore + (pointsGained ?? 0));
		setPointsGained(null);

		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex((i) => i + 1);
		} else {
			setShowFinalScore(true);
			setGameStarted(false);
		}
	};

	if (!gameStarted && !showFinalScore) {
		const playButtonClass =
			'cursor-pointer w-full px-8 flex-1 py-4 bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-105';

		const otherButtonClass =
			'cursor-pointer w-full px-8 flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-105';
		return (
			<div className='flex w-full items-center justify-center p-4 font-inter'>
				{/* Main container for the landing page content */}
				<main className='w-full max-w-2xl bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-8'>
					{/* Game Title */}
					<h1 className='text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-lime-500'>
						CalorieGuessr
					</h1>

					{/* Game description */}
					<p className='text-lg text-slate-300 max-w-lg leading-relaxed mb-8'>
						Guess the calories of fast foods. Looks can be deceving 👀
					</p>

					{/* Buttons container */}
					<div className='w-full flex flex-col justify-center items-center space-y-4 mt-8'>
						<div className='flex w-1/2 justify-center items-center'>
							<button onClick={startGame} disabled={loading} className={playButtonClass}>
								Play Daily Game
							</button>
						</div>
						<div className='flex w-full justify-center items-center space-x-4'>
							{/* Past Games button */}
							<button
								onClick={() => console.log('Coming soon: a list of your past games.')}
								className={otherButtonClass}
							>
								Past Games
							</button>

							{/* Your Stats button */}
							<button
								onClick={() => console.log('Coming soon: your user stats.')}
								className={otherButtonClass}
							>
								Your Stats
							</button>
						</div>
					</div>

					{/* Simple footer */}
					<footer className='text-white absolute bottom-4 text-center text-sm'>
						Game by{' '}
						<a className='font-bold' href='https://github.com/va-rau-jo'>
							Victor Araujo
						</a>
					</footer>
				</main>
			</div>
		);
	}

	if (loading) {
		return (
			<main className='flex w-full flex-col items-center justify-center p-24'>Loading...</main>
		);
	}

	if (error) {
		return (
			<main className='flex w-full flex-col items-center justify-center p-24'>
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
			<main className='flex w-full flex-col items-center justify-center p-24'>
				<h1 className='text-4xl font-bold mb-8'>Quiz Complete!</h1>
				<h2 className='text-2xl mb-4'>Your final score is: {Math.round(score)}</h2>
				<button
					onClick={() => {
						setShowFinalScore(false);
						setGameStarted(false);
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
		<main className='flex w-full flex-col items-center px-24'>
			{/* Top: Score & Question Number */}
			<div className='flex z-10 max-w-5xl w-full items-center justify-center font-mono'>
				<div className='text-2xl fixed left-8 top-8 flex justify-center pb-6 pt-8'>
					<ScoreDisplay score={score} pointsGained={pointsGained} />
				</div>
				<div className='text-3xl font-bold flex justify-center pb-6 pt-8'>
					Question {currentQuestionIndex + 1} / {questions.length}
				</div>
			</div>

			{/* Main: Question & Image */}
			<div className='relative flex flex-1 flex-col items-center mt-16 mb-8 w-full'>
				<h2 className='text-2xl font-semibold mb-4'>{currentQuestion.name}</h2>
				<div className='flex flex-1 relative h-[50vh] w-full justify-center'>
					{currentQuestion.image_url && (
						<Image
							className='border-4 border-gray-400 rounded-lg object-contain'
							src={currentQuestion.image_url}
							alt={currentQuestion.name}
							width={500}
							height={500}
						/>
					)}
				</div>
			</div>

			{/* Bottom: Input / Controls */}
			<div className='mb-16 flex justify-center w-full'>
				{!showAnswer ? (
					<div className='flex flex-col items-center'>
						<input
							type='number'
							value={userGuess}
							onChange={(e) => setUserGuess(e.target.value)}
							className='px-4 py-2 border rounded'
							placeholder='Enter your guess'
						/>
						<button
							onClick={handleGuess}
							className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Guess
						</button>
						<div className='mt-4 flex space-x-2'>
							{streak.map((isCorrect, index) => (
								<span key={index} className='text-xl'>
									{isCorrect ? '✅' : '❌'}
								</span>
							))}
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center text-xl'>
						<div className='font-mono'>
							<p>Your Answer: {userGuess}</p>
						</div>
						<div className='font-mono'>
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

			{/* Pop-up error */}
			{popupError && (
				<div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-center px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-500'>
					{popupError}
				</div>
			)}
		</main>
	);
}
