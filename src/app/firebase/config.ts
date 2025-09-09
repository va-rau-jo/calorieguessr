// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyDboXwOVHlMhnmWL-T9KxiFelc1mUOqTOs',
	authDomain: 'calorieguessr-cb8c0.firebaseapp.com',
	projectId: 'calorieguessr-cb8c0',
	storageBucket: 'calorieguessr-cb8c0.firebasestorage.app',
	messagingSenderId: '445502022369',
	appId: '1:445502022369:web:de96714d352bb4c3398da0',
	measurementId: 'G-S1W7K59ZT2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, firebaseConfig, db, auth };
