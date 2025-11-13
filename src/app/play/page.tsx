/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import ScoreDisplay from '../components/ScoreDisplay';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FoodItem } from '../types';
import { getScoresFromCookie, setGameCookie } from '../components/CookieManager';
import { getTodaysDateAsUnderscoreString } from '../../utils';
import { FinalScorePage } from '../components/FinalScorePage';
import Button, { ButtonColor, ButtonRound, ButtonSize } from '../components/Button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [gameStarted, setGameStarted] = useState(false);
	const [questions, setQuestions] = useState<FoodItem[]>([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [userGuess, setUserGuess] = useState('');
	const [score, setScore] = useState<number | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pointsGained, setPointsGained] = useState<number | null>(null);
	// The user's past scores
	const [scores, setScores] = useState<number[]>([]);
	const [showFinalScore, setShowFinalScore] = useState(false);
	const [gameDateString, setGameDateString] = useState('');

	// --- Animation refs/state ---
	const animFrameRef = useRef<number | null>(null);
	const animStartRef = useRef<number | null>(null);
	const animInitialPointsRef = useRef<number>(0);
	const animStartScoreRef = useRef<number>(0);
	const startPointsAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const SCORE_ANIMATION_DURATION_MS = 1000;

	// Initialize game data on component mount
	useEffect(() => {
		const startGame = async (gameDateString: string, questions: FoodItem[]) => {
			const scores = getScoresFromCookie(gameDateString);
			if (scores) {
				// Resume from the saved cookie state.
				setScore(scores.reduce((sum: number, score: number) => sum + score, 0));
				setScores(scores);
				if (scores.length === questions.length) {
					// Show the final score if all questions have been answered
					setShowFinalScore(true);
					return;
				} else {
					setCurrentQuestionIndex(scores.length);
					setGameStarted(true);
					setShowFinalScore(false);
					return;
				}
			}
			// No cookie, start a new game.
			setGameStarted(true);
			setShowFinalScore(false);
			setCurrentQuestionIndex(0);
			setScore(0);
			setScores([]);
		};

		const initializeGame = async () => {
			setLoading(true);

			try {
				// Set the current game's date to either today or the provided past game
				const dateString = searchParams.get('date') || getTodaysDateAsUnderscoreString();
				setGameDateString(dateString);

				console.log(dateString);

				// Fetch the questions for the current game date from Firebase
				const docRef = doc(db, 'dailyFoods', dateString);
				const docSnap = await getDoc(docRef);
				if (docSnap.exists()) {
					const data = docSnap.data();
					if (data) {
						setQuestions(data.foods);
						startGame(dateString, data.foods);
					} else {
						setError('Invalid data format received from database');
					}
				} else {
					setError('No questions available for this date');
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load questions');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};
		initializeGame();
	}, [questions.length, searchParams]); // Re-run when search params change

	// Clean up animation on unmount or when showAnswer toggles away
	useEffect(() => {
		return () => {
			if (animFrameRef.current !== null) {
				cancelAnimationFrame(animFrameRef.current);
				animFrameRef.current = null;
			}
		};
	}, []);

	// Start the points/score animation (exactly 1000ms, linear)
	const startPointsAnimation = (initialPoints: number) => {
		// Guard: nothing to animate
		if (initialPoints === null || initialPoints <= 0) {
			// Ensure the UI reflects zero points added and unchanged score
			setPointsGained(null);
			setScores((s) => [...s, initialPoints]);
			return;
		}

		// Capture starting values once
		animInitialPointsRef.current = initialPoints;
		animStartScoreRef.current = score ?? 0;
		animStartRef.current = null;

		// Cancel any previous animation before starting a new one
		if (animFrameRef.current !== null) {
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
			return;
		}
		const guess = parseInt(userGuess, 10);
		if (isNaN(guess)) {
			return;
		}

		const actual = questions[currentQuestionIndex].calories;
		const points = Math.max(0, 1000 - Math.abs(actual! - guess));

		setShowAnswer(true);

		const newScores = [...scores, points];
		const gameCompleted = currentQuestionIndex === questions.length - 1;
		setGameCookie(newScores, gameDateString, gameCompleted);

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
		setScore((prevScore) => (prevScore ?? 0) + (pointsGained ?? 0));
		setPointsGained(null);

		if (currentQuestionIndex < questions.length - 1) {
			const newIndex = currentQuestionIndex + 1;
			setCurrentQuestionIndex(newIndex);
		} else {
			setShowFinalScore(true);
			setGameStarted(false);
		}
	};

	// Display fnial score page if we have loaded from Firebase (images are fetched)
	if (!loading && showFinalScore) {
		return (
			<FinalScorePage
				score={score ?? 0}
				scores={scores}
				questions={questions}
				backCallback={() => {
					router.back();
				}}
			/>
		);
	}

	// Display error page if we have an error (or no questions for today)
	if (error) {
		return (
			<main className='flex w-full flex-col items-center justify-center p-24'>
				<p className='text-red-500 mb-4'>{error}</p>
				<Button onClick={() => router.back()} size={ButtonSize.Large} round={ButtonRound.Large}>
					← Back
				</Button>
			</main>
		);
	}

	// Display loading page if we are loading questions or images
	if ((!gameStarted && !showFinalScore) || loading) {
		return (
			<main className='flex w-full flex-col items-center justify-center p-24'>Loading...</main>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];
	const nextButtonOpacity = pointsGained === null ? 1 : 0;

	return (
		<main className='flex w-full flex-col items-center space-y-4 px-24'>
			{/* Top: Score & Question Number */}
			<div className='flex z-10 max-w-5xl w-full items-center justify-center'>
				<div className='text-2xl fixed right-4 flex justify-center pb-6 pt-8'>
					<ScoreDisplay score={score ?? 0} pointsGained={pointsGained} scores={scores} />
				</div>
				<div className='text-2xl fixed left-8 flex justify-center pb-6 pt-8'>
					<Button onClick={() => router.back()} round={ButtonRound.Large}>
						← Back
					</Button>
				</div>
				<div className='text-3xl font-bold flex justify-center pb-6 pt-8'>
					Question {currentQuestionIndex + 1} / {questions.length}
				</div>
			</div>

			{/* Main: Question & Image */}
			<div className='relative flex flex-1 flex-col items-center w-full'>
				<h2 className='text-2xl font-semibold mb-4'>{currentQuestion.name}</h2>
				<div className='flex flex-1 relative xs:h-50 sm:h-100 md:h-70 w-1/2 justify-center'>
					{currentQuestion.imageUrl && (
						<img
							className='border-4 border-gray-400 rounded-lg object-contain'
							src={currentQuestion.imageUrl}
							alt={currentQuestion.name}
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
								className='px-4 py-2 mb-4 border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								placeholder='Enter your guess'
							/>
							<Button
								onClick={handleGuess}
								color={ButtonColor.Blue}
								size={ButtonSize.Large}
								round={ButtonRound.Large}
							>
								Guess
							</Button>
						</>
					) : (
						<>
							<div className='font-mono'>
								<p>Your Answer: {userGuess}</p>
							</div>
							<div className='font-mono mb-4'>
								<p>Correct Answer: {currentQuestion.calories}</p>
							</div>
							<Button
								onClick={nextQuestion}
								style={{ opacity: nextButtonOpacity }}
								disabled={nextButtonOpacity === 0}
								color={ButtonColor.Green}
								size={ButtonSize.Large}
								round={ButtonRound.Large}
							>
								Next
							</Button>
						</>
					)}
				</div>
			</div>
		</main>
	);
}
