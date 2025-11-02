// components/MovingBackground.tsx

import React, { FC } from 'react';

const foodImages = [
	'/burger.png', // Top-left
	'/pizza.png', // Top-left
	'/fruit_bowl.png', // Top-left
	'/chicken_breast.png', // Top-left
	'/cake.png', // Top-left
	'/salad.png', // Top-left
	'/ramen.png', // Top-left
	'/milkshake.png', // Top-left
	'/taco.png', // Top-left
];

// Define the shape of a row configuration
interface RowConfig {
	id: number;
}

// Define the component props
interface MovingBackgroundProps {
	maxRows?: number;
}

// --- CONFIGURATION ---
const MAX_ROWS_ALLOWED = 5;

// The images need to be repeated enough times to cover the viewport
// and still have a duplicate set ready to start as the first set finishes.
// 3x repetition is usually safe: [Original Set] [Duplicate 1] [Duplicate 2]
const REPETITION_FACTOR = 4;

const MovingBackground: FC<MovingBackgroundProps> = ({ maxRows = MAX_ROWS_ALLOWED }) => {
	return (
		<div className='select-none fixed inset-0 overflow-hidden opacity-30 blur-[4px] grayscale'>
			{Array.from({ length: maxRows }).map((_, index) => {
				// Randomize the images to avoid repetition
				const randomizedImages = [...foodImages].sort(() => Math.random() - 0.5);
				// Duplicate the images for seamless looping - we need 2 identical sets
				const duplicatedImages = [...randomizedImages, ...randomizedImages, ...randomizedImages, ...randomizedImages];
				const imagesPerSet = randomizedImages.length;
				const rowDiv = (
					<div className={`flex flex-row flex-nowrap animate-scroll-left`} style={{ width: '200%' }}>
						{duplicatedImages.map((url, imgIndex) => (
							<div
								key={`${index}-${imgIndex}`}
								style={{
									width: `${50 / imagesPerSet}%`,
								}}
								className='flex-shrink-0 p-2'
							>
								<img
									src={url}
									alt={`Food background image ${imgIndex}`}
									className='w-full h-full object-cover rounded-md shadow-lg user-select-none pointer-events-none'
								/>
							</div>
						))}
					</div>
				);
				return (
					<div
						key={index}
						className={`flex w-full whitespace-nowrap will-change-transform`}
						style={{
							padding: '4rem 0', // Vertical spacing between rows
							height: '25vh', // Each row is 1/4 of the screen height
						}}
					>
						{rowDiv}
					</div>
				);
			})}
		</div>
	);
};

export default MovingBackground;
