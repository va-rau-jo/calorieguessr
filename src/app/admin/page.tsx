'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { FirebaseProvider } from '../firebase/FirebaseProvider';

interface FoodItem {
	id: string;
	name: string;
	calories: number;
}

export default function AdminPage() {
	const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
	const [days, setDays] = useState<Date[]>([]);

	useEffect(() => {
		// Fetch food items from Firebase
		const fetchFoodItems = async () => {
			try {
				const foodCollection = collection(db, 'foodItems');
				const foodSnapshot = await getDocs(foodCollection);
				const foodList = foodSnapshot.docs.map(
					(doc) =>
						({
							id: doc.id,
							...doc.data(),
						} as FoodItem)
				);
				setFoodItems(foodList);
			} catch (error) {
				console.error('Error fetching food items:', error);
			}
		};

		if (user) {
			fetchFoodItems();
		}
	}, [user]);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <div>Please sign in to access the admin page.</div>;
	}

	return (
		<FirebaseProvider>
			<div className='p-6'>
				<h1 className='text-2xl font-bold mb-6'>Admin Dashboard</h1>
				<div className='grid gap-6'>
					{days.map((day) => (
						<div key={day.toISOString()} className='border rounded-lg p-4'>
							<h2 className='text-xl font-semibold mb-4'>{format(day, 'EEEE, MMMM d, yyyy')}</h2>
							<div className='grid gap-2'>
								{foodItems.map((item) => (
									<div
										key={item.id}
										className='flex justify-between items-center bg-gray-50 p-3 rounded'
									>
										<span>{item.name}</span>
										<span>{item.calories} calories</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</FirebaseProvider>
	);
}
