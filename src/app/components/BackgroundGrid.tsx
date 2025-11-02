/* eslint-disable @next/next/no-img-element */
// components/BackgroundGrid.tsx
import Image from 'next/image';

// Use the paths to your food images
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
	// '/path/to/fruit-salad.jpg', // Top-center
	// '/path/to/pizza-slice.jpg', // Top-right
	// '/path/to/grilled-chicken-1.jpg', // Middle-left
	// '/path/to/grilled-chicken-2.jpg', // Center
	// '/path/to/pizza-whole.jpg', // Middle-right
	// '/path/to/grilled-chicken-3.jpg', // Bottom-left
	// '/path/to/grilled-chicken-4.jpg', // Bottom-center
	// '/path/to/chocolate-dessert.jpg', // Bottom-right
];

// Define a placeholder component for the grid cell
interface GridCellProps {
	src: string;
}

const GridUnit: React.FC = () => {
	return (
		<div className='h-fit w-fit grid grid-cols-3 grid-rows-3'>
			{foodImages.map((src, index) => (
				// The key ensures React can efficiently update the list
				<GridCell key={index} src={src} />
			))}
		</div>
	);
};

const GridCell: React.FC<GridCellProps> = ({ src }) => {
	return (
		// The container for each cell
		// - aspect-square: Forces a 1:1 (square) aspect ratio.
		// - max-h-[20vh]: Limits the height to 20% of the viewport height.
		// - overflow-hidden: Ensures the image doesn't bleed out of the square container.
		<div className='flex justify-center items-center aspect-square max-h-[20vh] overflow-hidden border border-black'>
			<img
				src={src}
				alt='Food item'
				// 'object-cover' ensures the image maintains its aspect ratio while filling the container
				style={{ objectFit: 'cover', userSelect: 'none', pointerEvents: 'none' }}
				// Priority to ensure the background loads quickly
			/>
		</div>
	);
};

// Main component
const BackgroundGrid: React.FC = () => {
	return (
		// Absolute positioning to place it behind all other content
		// - inset-0: sets top-0, right-0, bottom-0, left-0 to cover the whole screen.
		// - filter blur-md: Applies a medium blur effect.
		// - brightness-75: Darkens the background slightly to help text stand out.
		// - z-[-1]: Ensures it is in the background (adjust z-index as needed).
		<div className='absolute inset-0 z-0 filter blur-[2px] brightness-75 user-select-none'>
			<div className='h-full w-full'>
				<GridUnit />
			</div>
		</div>
	);
};

export default BackgroundGrid;
