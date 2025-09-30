'use client';

import React from 'react';
import { useFirebase } from './firebase/FirebaseProvider';
import { useRouter } from 'next/navigation';
import HomePage from './components/HomePage';

export default function Home() {
	const router = useRouter();
	const { isLoading } = useFirebase();

	const playDailyGame = () => {
		router.push('/play');
	};

	return <HomePage startGameCallback={playDailyGame} loading={isLoading ?? true} />;
}
