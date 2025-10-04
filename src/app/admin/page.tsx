'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, setDoc, doc, getDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { DailyFood, FoodItem, mapFirebaseFoodItem } from '../types';
import Button from '../components/Button';
import { dateToUnderscore } from '../utils';
import DailyFoodRowItem from '../components/DaillyFoodRowItem';

export default function AdminPage() {
	const [dailyFoods, setDailyFoods] = useState<DailyFood[]>([]);
	const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
	const [newFood, setNewFood] = useState<DailyFood>({
		date: date,
		items: Array(10).fill({ name: '', imageUrl: '' }),
		hasBeenUpdated: true,
	});
	const { user } = useFirebase();

	const fetchDailyFoods = useCallback(async () => {
		if (!user) return;
		const dailyFoodsRef = collection(db, 'dailyFoods');
		const querySnapshot = await getDocs(dailyFoodsRef);
		const foods: DailyFood[] = [];
		querySnapshot.forEach((doc) => {
			foods.push({
				date: doc.id,
				items: doc
					.data()
					.foods.map((item: { name: string; calories: number; imageUrl: string }) =>
						mapFirebaseFoodItem(item)
					),
				hasBeenUpdated: false,
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

	const handleNewItemChange = (_date: string, index: number, name: string) => {
		const items = [...newFood.items];
		items[index] = { ...items[index], name };
		setNewFood({ ...newFood, items });
	};

	const handleExistingItemChange = (date: string, index: number, name: string) => {
		const newDailyFoods = [...dailyFoods];
		const formattedDate = dateToUnderscore(date);
		const foods = newDailyFoods.find((f) => f.date === formattedDate);
		if (foods) {
			const items = [...foods.items];
			items[index] = { ...items[index], name };
			foods.items = items;
		}
		setDailyFoods(newDailyFoods);
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

	const fetchCalories = async (itemName: string): Promise<number | null> => {
		const caloriesRes = await fetch(`http://localhost:3001/api/food/calories?query=${itemName}`);
		let calories = null;
		if (caloriesRes.ok) {
			const data = await caloriesRes.json();
			calories = parseCaloriesFromJson(data);
		}
		return calories;
	};

	const fetchImage = async (itemName: string): Promise<string> => {
		const imageRes = await fetch(`http://localhost:3001/api/food/image?query=${itemName}`);
		if (imageRes.ok) {
			const data = await imageRes.json();
			return data.imageUrl || '';
		}
		return '';
	};

	const handleNewFetchData = async (_date: string, index: number) => {
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

			const [calories, imageUrl] = await Promise.all([
				fetchCalories(item.name),
				fetchImage(item.name),
			]);

			if (calories === null) {
				console.log('Failed to fetch calories for item:', item.name);
				return;
			}
			// Update the new food item with the fetched data
			const items = [...newFood.items];
			items[index] = { ...items[index], calories, imageUrl };
			setNewFood({ ...newFood, items });
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const handleExistingFetchData = async (date: string, index: number) => {
		const newDailyFoods = [...dailyFoods];
		const formattedDate = dateToUnderscore(date);
		const foods = newDailyFoods.find((f) => f.date === formattedDate);

		if (!foods) {
			console.log('No foods found for date:', formattedDate);
			return;
		}
		foods.hasBeenUpdated = true;
		const item = foods.items[index];
		if (!item.name) return;
		const itemName = item.name.toLowerCase();

		try {
			const existingFoodItem = await queryFoodsByName(db, itemName);

			if (existingFoodItem) {
				console.log('Food in firebase already');
				const items = [...foods.items];
				items[index] = {
					...items[index],
					calories: existingFoodItem.calories,
					imageUrl: existingFoodItem.imageUrl,
				};
				foods.items = items;
				console.log('Updated daily foods: ', foods);
				setDailyFoods(newDailyFoods);

				return;
			}

			const [calories, imageUrl] = await Promise.all([
				fetchCalories(item.name),
				fetchImage(item.name),
			]);

			if (calories === null) {
				console.log('Failed to fetch calories for item:', item.name);
				return;
			}
			// Update the food item with the fetched data
			const items = [...foods.items];
			items[index] = { ...items[index], calories, imageUrl };
			foods.items = items;
			setDailyFoods(newDailyFoods);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const handleNewSave = async () => {
		const firebaseData = {
			foods: newFood.items
				.filter((item) => item.name && item.calories)
				.map((item) => ({
					name: item.name,
					calories: item.calories,
					imageUrl: item.imageUrl,
				})),
		};

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

	const handleExistingSave = async () => {
		for (const dailyFood of dailyFoods.filter((f) => f.hasBeenUpdated)) {
			const firebaseData = {
				foods: dailyFood.items
					.filter((item) => item.name && item.calories)
					.map((item) => ({
						name: item.name,
						calories: item.calories,
						imageUrl: item.imageUrl,
					})),
			};

			// Save individual food items to foodItems collection
			for (const item of dailyFood.items) {
				if (item.name && item.calories && item.imageUrl) {
					const itemName = item.name.toLowerCase();
					const foodDocRef = doc(db, 'foodItems', itemName);
					console.log('Saving food item ', item);
					setDoc(foodDocRef, {
						name: item.name,
						calories: item.calories,
						imageUrl: item.imageUrl,
					}).then(() => {
						console.log(`Food item ${item.name} saved successfully`);
					});
				}
			}

			// Save daily foods data
			const docRef = doc(db, 'dailyFoods', dailyFood.date);
			setDoc(docRef, firebaseData).then(() => {
				console.log(`Daily food ${dailyFood.date} saved successfully`);
				fetchDailyFoods();
			});
		}
	};

	return (
		<div className='w-full p-6'>
			<h2 className='text-2xl font-bold mb-6'>Admin Dashboard</h2>
			<Button onClick={() => (window.location.href = '/')}>Back to Home</Button>

			{/* Add New Food Form */}
			<DailyFoodRowItem
				newFood={newFood}
				setNewFood={setNewFood}
				handleSave={handleNewSave}
				handleItemChange={handleNewItemChange}
				handleFetchData={handleNewFetchData}
			/>

			{/* Existing Daily Foods */}
			<div className='grid gap-6'>
				{dailyFoods.map(({ date, items }) => {
					const placeholders = Array(Math.max(0, 10 - items.length)).fill({
						name: '',
						imageUrl: '',
					});
					const displayItems = [...items, ...placeholders];
					return (
						<DailyFoodRowItem
							key={date}
							date={date}
							items={displayItems}
							handleItemChange={handleExistingItemChange}
							handleFetchData={handleExistingFetchData}
							handleSave={handleExistingSave}
						/>
					);
				})}
			</div>
		</div>
	);
}
