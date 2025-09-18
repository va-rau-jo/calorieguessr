import React from 'react';
import Image from 'next/image';
import { DailyFood, FoodItem } from '../types';

interface DailyFoodRowItemProps {
	date?: string;
	items?: FoodItem[];
	newFood?: DailyFood;
	setNewFood?: (food: DailyFood) => void;
	handleSave?: () => void;
	handleItemChange?: (index: number, value: string) => void;
	handleFetchData?: (index: number) => void;
}

const BUTTON_CLASS =
	'cursor-pointer ml-auto bg-blue-500 disabled:bg-blue-300 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';

export default function DailyFoodRowItem({
	date,
	items,
	newFood,
	setNewFood,
	handleSave,
	handleItemChange,
	handleFetchData,
}: DailyFoodRowItemProps) {
	if (!date && !items) {
		if (!newFood || !setNewFood || !handleSave || !handleItemChange || !handleFetchData) {
			throw new Error('Required props are missing for new DailyFoodRowItem.');
		}
	} else if (!newFood) {
		if (!date || !items) {
			throw new Error('Required props are missing for existing DailyFoodRowItem.');
		}
	}

	function formatDate(dateString: string): string {
		const formattedDateString = dateString.replace(/_/g, '-');
		return formattedDateString;
	}

	const isExistingItem = Boolean(date && items);
	const itemsToDisplay = isExistingItem ? items : newFood!.items;
	const formattedDate = formatDate(isExistingItem ? date! : newFood!.date);

	return (
		<div className='rounded-lg shadow p-4 mb-6'>
			<div className='flex items-center mb-4'>
				<input
					type='date'
					value={formattedDate}
					onChange={(e) => setNewFood && setNewFood({ ...newFood!, date: e.target.value })}
					className='text-white text-2xl font-bold text-center bg-transparent'
					disabled={isExistingItem}
				/>
				{!isExistingItem && (
					<button onClick={handleSave} className={BUTTON_CLASS}>
						Save
					</button>
				)}
			</div>
			<div className='text-black grid grid-cols-2 md:grid-cols-5 gap-4'>
				{itemsToDisplay!.map((item, index) => (
					<div key={index} className='bg-gray-50 rounded p-3'>
						{item.imageUrl && (
							<img
								src={item.imageUrl}
								alt={item.name}
								className='w-full h-24 object-cover rounded-md mb-2'
							/>
						)}
						<div className='flex'>
							<input
								type='text'
								placeholder='Food name'
								value={item.name}
								onChange={(e) => handleItemChange && handleItemChange(index, e.target.value)}
								className='font-medium w-full'
								disabled={isExistingItem}
							/>
							{!isExistingItem && (
								<button
									onClick={() => handleFetchData!(index)}
									className={BUTTON_CLASS + ' text-xs'}
									disabled={!item.name}
								>
									Fetch
								</button>
							)}
						</div>
						<div className='text-gray-600 text-sm'>{item.calories ?? '???'} calories</div>
					</div>
				))}
			</div>
		</div>
	);
}
