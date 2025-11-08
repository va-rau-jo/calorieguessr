/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { DailyFood, FoodItem } from '../types';
import Button, { ButtonColor } from './Button';
import { dateToHyphenated } from '../../utils';

interface DailyFoodRowItemProps {
	date?: string;
	items?: FoodItem[];
	newFood?: DailyFood;
	setNewFood?: (food: DailyFood) => void;
	handleSave?: () => void;
	handleItemChange?: (date: string, index: number, value: string) => void;
	handleFetchData?: (date: string, index: number) => void;
}

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

	const isExistingItem = Boolean(date && items);
	const itemsToDisplay = isExistingItem ? items : newFood!.items;
	const formattedDate = dateToHyphenated(isExistingItem ? date! : newFood!.date);

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
				<Button onClick={handleSave} color={ButtonColor.Secondary}>
					Save
				</Button>
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
								onChange={(e) =>
									handleItemChange && handleItemChange(formattedDate, index, e.target.value)
								}
								className='font-medium w-full'
							/>
							<Button onClick={() => handleFetchData!(formattedDate, index)}>Fetch</Button>
						</div>
						{item.calories && <div className='text-gray-600 text-sm'>{item.calories} calories</div>}
					</div>
				))}
			</div>
		</div>
	);
}
