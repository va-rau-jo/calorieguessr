// components/MovingBackground.tsx

import React, { FC, useState, useEffect } from 'react';

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
	const [blurValue, setBlurValue] = useState('4px');

	useEffect(() => {
		const updateBlur = () => {
			// Detect zoom level by measuring a test element
			// Create a temporary div with 100px width and measure its actual rendered width
			const testDiv = document.createElement('div');
			testDiv.style.width = '100px';
			testDiv.style.position = 'absolute';
			testDiv.style.visibility = 'hidden';
			document.body.appendChild(testDiv);
			
			const rect = testDiv.getBoundingClientRect();
			const zoom = 100 / rect.width; // 100px expected / actual rendered width
			
			document.body.removeChild(testDiv);
			
			// Base blur value that scales with zoom
			// At 100% zoom (zoom = 1), blur is 4px
			// As you zoom out (zoom < 1), blur decreases proportionally to maintain visual consistency
			const baseBlur = 4 / zoom;
			setBlurValue(`${baseBlur}px`);
		};

		updateBlur();
		
		// Use a debounced resize handler for better performance
		let timeoutId: NodeJS.Timeout;
		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(updateBlur, 100);
		};
		
		window.addEventListener('resize', handleResize);
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', handleResize);
			window.visualViewport.addEventListener('scroll', handleResize);
		}
		
		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('resize', handleResize);
			if (window.visualViewport) {
				window.visualViewport.removeEventListener('resize', handleResize);
				window.visualViewport.removeEventListener('scroll', handleResize);
			}
		};
	}, []);

	return (
		<div 
			className='select-none fixed inset-0 overflow-hidden opacity-30'
			style={{filter: `blur(${blurValue}) grayscale(100%)`}}
		>
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
