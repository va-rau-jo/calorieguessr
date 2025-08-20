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
	const SCORE_ANIMATION_DURATION_MS = 1000;

	// Pop-up fade
	useEffect(() => {
		if (popupError) {
			const t = setTimeout(() => setPopupError(null), 3000);
			return () => clearTimeout(t);
		}
	}, [popupError]);

	const startGame = async () => {
		setGameStarted(true);
		setLoading(true);
		setShowFinalScore(false);
		setError(null);

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
					const calories = match ? parseInt(match[1], 10) : 0;

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

	// Start the points/score animation (exactly 1000ms, linear)
	const startPointsAnimation = (initialPoints: number) => {
		// Guard: nothing to animate
		if (initialPoints <= 0) {
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
				setTimeout(() => {
					setPointsGained(null);
				}, 1000);
				setScore(animStartScoreRef.current + animInitialPointsRef.current);
				animFrameRef.current = null;
			}
		};

		animFrameRef.current = requestAnimationFrame(tick);
	};

	// Clean up animation on unmount or when showAnswer toggles away
	useEffect(() => {
		return () => {
			if (animFrameRef.current !== null) {
				cancelAnimationFrame(animFrameRef.current);
				animFrameRef.current = null;
			}
		};
	}, []);

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
		setPointsGained(points);
		setTimeout(() => {
			startPointsAnimation(points);
		}, 1000);
	};

	const nextQuestion = () => {
		// Ensure any running animation is stopped
		if (animFrameRef.current !== null) {
			cancelAnimationFrame(animFrameRef.current);
			animFrameRef.current = null;
		}
		setShowAnswer(false);
		setUserGuess('');
		setPointsGained(null);

		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex((i) => i + 1);
		} else {
			setShowFinalScore(true);
			setGameStarted(false);
		}
	};

	// --- RENDER STATES ---
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
			{/* Top: Score & Question Number */}
			<div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex'>
				<div className='fixed left-8 top-8 flex justify-center pb-6 pt-8'>
					<ScoreDisplay score={score} pointsGained={pointsGained} />
				</div>
				<div className='fixed top-8 left-1/2 -translate-x-1/2 flex justify-center pb-6 pt-8 text-black dark:text-white'>
					Question {currentQuestionIndex + 1} of {questions.length}
				</div>
			</div>

			{/* Main: Question & Image */}
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

			{/* Bottom: Input / Controls */}
			<div className='mt-8 mb-32 flex justify-center w-full'>
				{!showAnswer ? (
					<div className='flex flex-col items-center'>
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

			{/* Pop-up error */}
			{popupError && (
				<div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-center px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-500'>
					{popupError}
				</div>
			)}
		</main>
	);
}
