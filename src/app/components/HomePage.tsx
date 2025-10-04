import React from 'react';
import { useFirebase } from '../firebase/FirebaseProvider';
import { deleteAllCookies } from './CookieManager';
import { useRouter } from 'next/navigation';
import Button, { ButtonColor, ButtonRound, ButtonSize } from './Button';

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
					<Button
						onClick={signOut}
						color={ButtonColor.Secondary}
						size={ButtonSize.Large}
						round={ButtonRound.Full}
					>
						Sign Out
					</Button>
					{isAdmin && (
						<Button
							onClick={() => (window.location.href = '/admin')}
							color={ButtonColor.Secondary}
							size={ButtonSize.Small}
							round={ButtonRound.Full}
						>
							Admin
						</Button>
					)}
					{isAdmin && (
						<Button
							onClick={() => {
								deleteAllCookies();
								window.location.reload();
							}}
							color={ButtonColor.Secondary}
							size={ButtonSize.Small}
							round={ButtonRound.Full}
						>
							Clear Cookies
						</Button>
					)}
				</div>
			) : (
				<Button
					onClick={signIn}
					color={ButtonColor.Secondary}
					size={ButtonSize.Small}
					round={ButtonRound.Full}
				>
					Sign In
				</Button>
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
						<Button
							onClick={startGameCallback}
							disabled={loading}
							color={ButtonColor.Lime}
							size={ButtonSize.ExtraLarge}
							round={ButtonRound.Full}
						>
							Play Daily Game
						</Button>
					</div>
					<div className='flex w-full justify-center items-center space-x-4'>
						<Button
							onClick={() => router.push('/past-games')}
							color={ButtonColor.Secondary}
							size={ButtonSize.Large}
							round={ButtonRound.Full}
						>
							Past Games
						</Button>

						<Button
							onClick={() => console.log('Coming soon: your user stats.')}
							color={ButtonColor.Secondary}
							size={ButtonSize.Large}
							round={ButtonRound.Full}
						>
							Your Stats
						</Button>
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
