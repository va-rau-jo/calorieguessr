'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, getAuth, User, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface FirebaseContextType {
	auth: ReturnType<typeof getAuth> | null;
	db: ReturnType<typeof getFirestore> | null;
	firebaseConfig: typeof firebaseConfig;
	// Google Sign In Fields
	isLoading: boolean | null;
	user: User | null;
	signIn: () => Promise<void>;
	signOut: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();
const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebase() {
	const context = useContext(FirebaseContext);
	if (context === null) {
		throw new Error('useFirebase must be used within a FirebaseProvider');
	}
	return context;
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
	// Google Sign In
	const [user, setUser] = useState<User | null>(null);
	// Firebase Setup
	const [firebaseApp, setFirebaseApp] = useState<ReturnType<typeof initializeApp> | null>(null);
	const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
	const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const signIn = async () => {
		if (!auth) {
			console.error('Firebase Auth not initialized.');
			return;
		}

		try {
			const userCredential = await signInWithPopup(auth, googleProvider);
			const user = userCredential.user;
			setUser(user);
		} catch (error: unknown) {
			if (error instanceof Error) {
				const errorMessage = error.message;
				console.error('Error signing up:', errorMessage);
			}
		}
	};

	const signOut = async () => {
		if (!auth) {
			return;
		}
		await firebaseSignOut(auth);
	};

	// Firebase Initialization and Auth State Management
	useEffect(() => {
		try {
			let appInstance: ReturnType<typeof initializeApp>;
			if (!firebaseApp) {
				appInstance = initializeApp(firebaseConfig);
				setFirebaseApp(appInstance);
			} else {
				appInstance = firebaseApp;
			}

			setDb(getFirestore(appInstance));
			const firebaseAuth = getAuth(appInstance);
			setAuth(firebaseAuth);

			const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
				setUser(user);
				setIsLoading(false);
			});

			return () => unsubscribe();
		} catch (error) {
			console.error('Failed to initialize Firebase or authentication:', error);
			setIsLoading(false);
		}
	}, [firebaseApp]);

	const contextValue: FirebaseContextType = {
		db,
		auth,
		firebaseConfig,
		isLoading,
		user,
		signIn,
		signOut,
	};

	if (isLoading) {
		return null;
	}

	return <FirebaseContext.Provider value={contextValue}>{children}</FirebaseContext.Provider>;
}
