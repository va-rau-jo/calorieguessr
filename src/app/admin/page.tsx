'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { DailyFood, FoodItem } from '../types';
import DailyFoodRowItem from '../components/DaillyFoodRowItem';

export default function AdminPage() {
	const [dailyFoods, setDailyFoods] = useState<DailyFood[]>([]);
	const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
	const [newFood, setNewFood] = useState<DailyFood>({
		date: date,
		items: Array(10).fill({ name: '', calories: null, imageUrl: '' }),
	});
	const { user } = useFirebase();

	const mapFirebaseFoodItem = (item: { name: string; calories: number | null }): FoodItem => {
		return {
			name: item.name,
			calories: item.calories,
			imageUrl: '', // Default empty string for imageUrl since Firebase item doesn't include it
		};
	};

	const fetchDailyFoods = useCallback(async () => {
		if (!user) return;
		const dailyFoodsRef = collection(db, 'dailyFoods');
		const querySnapshot = await getDocs(dailyFoodsRef);
		const foods: DailyFood[] = [];
		querySnapshot.forEach((doc) => {
			console.log(doc.data());
			foods.push({
				date: doc.id,
				items: doc
					.data()
					.foods.map((item: { name: string; calories: number | null }) =>
						mapFirebaseFoodItem(item)
					),
			});
		});
		setDailyFoods(foods.sort((a, b) => b.date.localeCompare(a.date)));
	}, [user]);

	useEffect(() => {
		if (!user || user.email !== 'victor@lunenetworks.com') {
			return;
		}

		const initApi = async () => {
			try {
				const initResponse = await fetch(`http://localhost:3001/api/init`);
				if (!initResponse.ok) {
					throw new Error('Failed to initialize food API.');
				}
			} catch (error) {
				console.error('Error fetching questions with images:', error);
			}
		};

		initApi();
		fetchDailyFoods();
	}, [fetchDailyFoods, user]);

	if (!user) {
		window.location.href = '/';
		return null;
	}

	const handleItemChange = (index: number, name: string) => {
		const items = [...newFood.items];
		items[index] = { ...items[index], name };
		setNewFood({ ...newFood, items });
	};

	const handleFetchData = async (index: number) => {
		const item = newFood.items[index];
		console.log(item);
		try {
			// Fetch calories
			console.log('Fetching calories...');
			const caloriesRes = await fetch(`http://localhost:3001/api/food/calories?query=${item.name}`);
			console.log(caloriesRes);
			let calories = null;
			if (caloriesRes.ok) {
				const data = await caloriesRes.json();
				calories = data.calories || null;
			}

			// Fetch image
			console.log('Fetching image...');
			const imageRes = await fetch(`http://localhost:3001/api/food/image?query=${item.name}`);
			console.log(imageRes);
			let imageUrl = '';
			if (imageRes.ok) {
				const data = await imageRes.json();
				imageUrl = data.imageUrl || '';
			}

			// Update the new food item with the fetched data
			const items = [...newFood.items];
			items[index] = { ...items[index], calories, imageUrl };
			setNewFood({ ...newFood, items });
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const handleSave = async () => {
		if (!newFood.date) return;
		const docRef = doc(db, 'dailyFoods', newFood.date);
		await setDoc(docRef, { items: newFood.items });
		fetchDailyFoods();
	};

	console.log('DAILY FOODS');
	console.log(dailyFoods);
	console.log('NEW FOODS');
	console.log(newFood);

	return (
		<div className='p-6'>
			<h2 className='text-2xl font-bold mb-6'>Admin Dashboard</h2>

			{/* Add New Food Form */}
			<DailyFoodRowItem
				newFood={newFood}
				setNewFood={setNewFood}
				handleSave={handleSave}
				handleItemChange={handleItemChange}
				handleFetchData={handleFetchData}
			/>

			{/* Existing Daily Foods */}
			<div className='grid gap-6'>
				{dailyFoods.map(({ date, items }) => (
					<DailyFoodRowItem key={date} date={date} items={items} />
				))}
			</div>
		</div>
	);
}
