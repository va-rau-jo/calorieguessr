// components/MovingBackground.tsx

import React, { FC } from 'react';

const MAX_ROWS_ALLOWED = 4;
const foodImages = [
	'/burger.png',
	'/pizza.png',
	'/fruit_bowl.png',
	'/chicken_breast.png',
	'/cake.png',
	'/salad.png',
	'/ramen.png',
	'/milkshake.png', 
	'/taco.png', 
];

const MovingBackground: FC = () => {
	return (
		<div className='select-none fixed inset-0 overflow-hidden opacity-30 blur-[4px] grayscale'>
			{Array.from({ length: MAX_ROWS_ALLOWED }).map((_, index) => {
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
