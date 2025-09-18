// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Update https://console.firebase.google.com/u/0/project/XXX/authentication
// to sign in with Google.
const firebaseConfig = {
	apiKey: 'AIzaSyDboXwOVHlMhnmWL-T9KxiFelc1mUOqTOs',
	authDomain: 'calorieguessr-cb8c0.firebaseapp.com',
	projectId: 'calorieguessr-cb8c0',
	storageBucket: 'calorieguessr-cb8c0.firebasestorage.app',
	messagingSenderId: '445502022369',
	appId: '1:445502022369:web:de96714d352bb4c3398da0',
	measurementId: 'G-S1W7K59ZT2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, firebaseConfig, db, auth };
