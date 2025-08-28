'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ScoreDisplay from './components/ScoreDisplay';
import HomePage from './components/HomePage';

interface FoodItem {
	name: string;
	calories: number;
	image_url: string;
}

const foodImages: string[] = [
	'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2072&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1568901083984-7a9609c13b3a?q=80&w=2070&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1550547660-d94508490a35?q=80&w=2070&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1542826438-bd962f92476d?q=80&w=1924&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1596956627008-0130d210519a?q=80&w=2070&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1619895029413-176c49615598?q=80&w=1932&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1588636173041-e94fdfb7858c?q=80&w=2070&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1628846985392-f08985144b6c?q=80&w=1935&auto=format&fit=crop',
];

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
	// The user's past scores
	const [scores, setScores] = useState<number[]>([]);
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
			setScores([]);
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
			setScores((s) => [...s, initialPoints]);
			return;
		}

		// Capture starting values once
		animInitialPointsRef.current = initialPoints;
		animStartScoreRef.current = score;
		animStartRef.current = null;

		// Cancel any previous animation before starting a new one
		if (animFrameRef.current !== null) {
			console.log('CANCELLING');
			cancelAnimationFrame(animFrameRef.current);
			setScores((s) => [...s, initialPoints]);
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
					console.log('Setting scores streak');
					setScores((s) => [...s, initialPoints]);
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

		setShowAnswer(true);

		// Initialize points (display starting value) and kick off animation
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
		return <HomePage loading={loading} startGameCallback={startGame} />;
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
						setScores([]);
					}}
					className='px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-700 transition-colors'
				>
					Play Again
				</button>
			</main>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];

	console.log('window.innerWidth', window.innerWidth);
	console.log('window.innerHeight', window.innerHeight);

	const nextButtonOpacity = pointsGained === null ? 1 : 0;

	return (
		<main className='flex w-full flex-col items-center space-y-4 px-24'>
			{/* Top: Score & Question Number */}
			<div className='flex z-10 max-w-5xl w-full items-center justify-center font-mono'>
				<div className='text-2xl fixed left-8 top-8 flex justify-center pb-6 pt-8'>
					<ScoreDisplay score={score} pointsGained={pointsGained} scores={scores} />
				</div>
				<div className='text-3xl font-bold flex justify-center pb-6 pt-8'>
					Question {currentQuestionIndex + 1} / {questions.length}
				</div>
			</div>

			{/* Main: Question & Image */}
			<div className='relative flex flex-1 flex-col items-center  w-full'>
				<h2 className='text-2xl font-semibold mb-4'>{currentQuestion.name}</h2>
				<div className='flex flex-1 relative xs:h-50 sm:h-100 md:h-70 w-full justify-center'>
					{currentQuestion.image_url && (
						<Image
							className='border-4 border-gray-400 rounded-lg object-contain'
							src={currentQuestion.image_url}
							alt={currentQuestion.name}
							fill={true}
						/>
					)}
				</div>
			</div>

			{/* Bottom: Input / Controls */}
			<div className='mb-4 flex justify-center w-full'>
				<div className='flex flex-col items-center text-xl'>
					{!showAnswer ? (
						<>
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
						</>
					) : (
						<>
							<div className='font-mono'>
								<p>Your Answer: {userGuess}</p>
							</div>
							<div className='font-mono'>
								<p>Correct Answer: {currentQuestion.calories}</p>
							</div>
							<button
								onClick={nextQuestion}
								style={{ opacity: nextButtonOpacity }}
								disabled={nextButtonOpacity === 0}
								className='mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
							>
								Next
							</button>
						</>
					)}
				</div>
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
