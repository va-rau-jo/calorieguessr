'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, setDoc, doc, getDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { DailyFood, FoodItem } from '../types';
import DailyFoodRowItem from '../components/DaillyFoodRowItem';

export default function AdminPage() {
	const [dailyFoods, setDailyFoods] = useState<DailyFood[]>([]);
	const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
	const [newFood, setNewFood] = useState<DailyFood>({
		date: date,
		items: Array(10).fill({ name: '', calories: 0, imageUrl: '' }),
	});
	const { user } = useFirebase();

	const mapFirebaseFoodItem = (item: {
		name: string;
		calories: number;
		imageUrl: string;
	}): FoodItem => {
		return {
			name: item.name,
			calories: item.calories,
			imageUrl: item.imageUrl,
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
					.foods.map((item: { name: string; calories: number; imageUrl: string }) =>
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

	const parseCaloriesFromJson = (jsonData: { food_description: string }): number => {
		const desc = jsonData['food_description'] as string;
		const match = desc.match(/Calories:\s*(\d+)/);
		let calories = match ? parseInt(match[1], 10) : 0;

		const serving = desc.split('Calories')[0];
		if (serving) {
			const fraction = serving.split('Per')[1].trim();
			const multiplier = parseInt(fraction.split('/')[1], 10);
			if (!isNaN(multiplier)) {
				calories *= multiplier;
			}
		}
		return calories;
	};

	const queryFoodsByName = async (db: Firestore, foodName: string) => {
		const foodDocRef = doc(db, 'foodItems', foodName);

		try {
			const docSnap = await getDoc(foodDocRef);

			if (docSnap.exists()) {
				return docSnap.data();
			} else {
				console.log(`No food item found with the name: ${foodName}`);
				return null;
			}
		} catch (error) {
			console.error('Error retrieving food item:', error);
			return null;
		}
	};

	const handleFetchData = async (index: number) => {
		const item = newFood.items[index];
		if (!item.name) return;

		const itemName = item.name.toLowerCase();

		try {
			const existingFoodItem = await queryFoodsByName(db, itemName);

			if (existingFoodItem) {
				const items = [...newFood.items];
				items[index] = {
					...items[index],
					calories: existingFoodItem.calories,
					imageUrl: existingFoodItem.imageUrl,
				};
				setNewFood({ ...newFood, items });
				return;
			}

			// Fetch calories
			const caloriesRes = await fetch(`http://localhost:3001/api/food/calories?query=${item.name}`);
			let calories = null;
			if (caloriesRes.ok) {
				const data = await caloriesRes.json();
				calories = parseCaloriesFromJson(data);
			}

			// Fetch image
			const imageRes = await fetch(`http://localhost:3001/api/food/image?query=${item.name}`);
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
		console.log('SAVING ');
		console.log(newFood);

		const firebaseData = {
			foods: newFood.items
				.filter((item) => item.name && item.calories)
				.map((item) => ({
					name: item.name,
					calories: item.calories,
					imageUrl: item.imageUrl,
				})),
		};

		console.log('FIREBASE DATA');
		console.log(firebaseData);

		for (const item of newFood.items) {
			if (item.name && item.calories && item.imageUrl) {
				const itemName = item.name.toLowerCase();
				const foodDocRef = doc(db, 'foodItems', itemName);
				await setDoc(foodDocRef, {
					name: item.name,
					calories: item.calories,
					imageUrl: item.imageUrl,
				}).then(() => {
					console.log(`Food item ${item.name} saved successfully`);
				});
			}
		}

		const docRef = doc(db, 'dailyFoods', newFood.date);
		setDoc(docRef, firebaseData).then(() => {
			console.log(`Daily food ${newFood.date} saved successfully`);
			fetchDailyFoods();
		});
	};

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
