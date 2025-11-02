import React from 'react';

export enum ButtonSize {
	Small = 'small',
	Medium = 'medium',
	Large = 'large',
	ExtraLarge = 'extraLarge',
}

export enum ButtonColor {
	Lime = 'lime',
	Green = 'green',
	Blue = 'blue',
	Secondary = 'secondary',
	Danger = 'danger',
}

export enum ButtonRound {
	Large = 'large',
	Full = 'full',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	color?: ButtonColor;
	size?: ButtonSize;
	round?: ButtonRound;
	additionalClassNames?: string;
}

const Button: React.FC<ButtonProps> = ({
	color = ButtonColor.Secondary,
	size = ButtonSize.Medium,
	round = ButtonRound.Large,
	disabled = false,
	additionalClassNames = '',
	onClick,
	children,
	...props
}) => {
	const baseClasses =
		' font-bold rounded transition-transform duration-200 ease-in-out hover:scale-105 cursor-pointer uppercase';

	const sizeClasses = {
		[ButtonSize.Small]: 'text-sm py-2 px-4',
		[ButtonSize.Medium]: 'text-base py-2 px-4',
		[ButtonSize.Large]: 'text-xl py-4 px-8',
		[ButtonSize.ExtraLarge]: 'text-2xl py-4 px-12',
	};

	const colorClasses = {
		[ButtonColor.Lime]: {
			base: 'bg-[#2DA87B] text-white',
			hover: 'hover:bg-[#248561]',
			disabled: 'bg-[#79ab99] cursor-not-allowed',
		},
		[ButtonColor.Green]: {
			base: 'bg-green-500 text-white',
			hover: 'hover:bg-green-700',
			disabled: 'bg-green-300 cursor-not-allowed',
		},
		[ButtonColor.Blue]: {
			base: 'bg-blue-500 text-white',
			hover: 'hover:bg-blue-700',
			disabled: 'bg-blue-300 cursor-not-allowed',
		},
		[ButtonColor.Secondary]: {
			base: 'bg-gray-700 text-white',
			hover: 'hover:bg-gray-700',
			disabled: 'bg-gray-300 cursor-not-allowed',
		},
		[ButtonColor.Danger]: {
			base: 'bg-red-500 text-white',
			hover: 'hover:bg-red-700',
			disabled: 'bg-red-300 cursor-not-allowed',
		},
	};

	const roundClasses = {
		[ButtonRound.Large]: 'rounded-lg',
		[ButtonRound.Full]: 'rounded-full',
	};

	const disabledClasses = disabled ? colorClasses[color].disabled : colorClasses[color].hover;

	const className = `
    ${baseClasses}
    ${additionalClassNames}
    ${sizeClasses[size]}
    ${colorClasses[color].base}
    ${roundClasses[round]}
    ${disabledClasses}
  `;

	return (
		<button className={className} onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	);
};

export default Button;
