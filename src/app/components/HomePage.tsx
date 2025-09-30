import React from 'react';
import { useFirebase } from '../firebase/FirebaseProvider';
import { deleteCookie } from '../utils';
import { COOKIE_NAME_SCORE } from '../constants';
import { useRouter } from 'next/navigation';

const PLAY_BUTTON_CLASS =
	'cursor-pointer w-full px-8 flex-1 py-4 bg-lime-500 hover:bg-lime-600 text-slate-900' +
	' font-bold rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-105';

const DISABLED_PLAY_BUTTON_CLASS =
	'w-full px-8 flex-1 py-4 bg-lime-500/50 text-slate-900' +
	' font-bold rounded-full shadow-lg transition-transform duration-200 ease-in-out';

const OTHER_BUTTON_CLASS =
	'cursor-pointer w-full px-8 flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 ' +
	'font-semibold rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-105';

const LOGIN_BUTTON_CLASS =
	'cursor-pointer px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 ' +
	'font-semibold rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-105';

interface HomePageProps {
	loading: boolean;
	startGameCallback: () => void;
}

export default function HomePage({ loading, startGameCallback }: HomePageProps) {
	const { user, signIn, signOut } = useFirebase();
	const router = useRouter();

	const isAdmin = user?.email === 'victor@lunenetworks.com';

	return (
		<div className='flex w-full items-center justify-center p-4 font-inter'>
			{user ? (
				<div className='flex absolute top-4 right-4'>
					<button className={`${LOGIN_BUTTON_CLASS} `} onClick={signOut}>
						Sign Out
					</button>
					{isAdmin && (
						<button
							className={`${LOGIN_BUTTON_CLASS}`}
							onClick={() => (window.location.href = '/admin')}
						>
							Admin
						</button>
					)}
					{isAdmin && (
						<button
							className={`${LOGIN_BUTTON_CLASS}`}
							onClick={() => {
								deleteCookie(COOKIE_NAME_SCORE);
								window.location.reload();
							}}
						>
							Clear Cookies
						</button>
					)}
				</div>
			) : (
				<button className={`${LOGIN_BUTTON_CLASS} absolute top-4 right-4`} onClick={signIn}>
					Sign In
				</button>
			)}

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
						<button
							onClick={startGameCallback}
							disabled={loading}
							className={loading ? DISABLED_PLAY_BUTTON_CLASS : PLAY_BUTTON_CLASS}
						>
							Play Daily Game
						</button>
					</div>
					<div className='flex w-full justify-center items-center space-x-4'>
						{/* Past Games button */}
						<button onClick={() => router.push('/past-games')} className={OTHER_BUTTON_CLASS}>
							Past Games
						</button>

						{/* Your Stats button */}
						<button
							onClick={() => console.log('Coming soon: your user stats.')}
							className={OTHER_BUTTON_CLASS}
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
