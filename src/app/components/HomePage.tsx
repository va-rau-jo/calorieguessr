/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { useFirebase } from '../firebase/FirebaseProvider';
import { deleteAllCookies } from './CookieManager';
import { useRouter } from 'next/navigation';
import Button, { ButtonColor, ButtonRound, ButtonSize } from './Button';
import MovingBackground from './MovingBackground';

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
			<MovingBackground />

			{user ? (
				<div className='flex absolute top-4 right-4'>
					<Button
						onClick={signOut}
						color={ButtonColor.Secondary}
						size={ButtonSize.Large}
						round={ButtonRound.Large}
					>
						Sign Out
					</Button>
					{isAdmin && (
						<Button
							onClick={() => (window.location.href = '/admin')}
							color={ButtonColor.Secondary}
							size={ButtonSize.Small}
							round={ButtonRound.Large}
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
							round={ButtonRound.Large}
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
					round={ButtonRound.Large}
				>
					Sign In
				</Button>
			)}

			{/* Main container for the landing page content */}
			<main className='select-none absolute w-full max-w-2xl bg-slate-800 py-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-8'>
				<div className='flex flex-col items-center space-y-4'>
					<img src='/title.svg' alt='CalorieGuessr logo' />
					<p className='text-lg text-slate-300 max-w-lg leading-relaxed'>
						Guess calories of fast foods. Looks can be deceving 👀
					</p>
				</div>
				{/* Buttons container */}
				<div className='w-full flex flex-col justify-center items-center space-y-4'>
					<div className='flex w-3/4 justify-center items-center'>
						<Button
							onClick={startGameCallback}
							disabled={loading}
							color={ButtonColor.Lime}
							size={ButtonSize.ExtraLarge}
							round={ButtonRound.Large}
						>
							Play Daily Game
						</Button>
					</div>
					<div className='flex w-full justify-center items-center space-x-4'>
						<Button
							onClick={() => router.push('/past-games')}
							color={ButtonColor.Secondary}
							size={ButtonSize.Large}
							round={ButtonRound.Large}
						>
							Past Games
						</Button>
					</div>
				</div>
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
