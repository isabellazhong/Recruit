type ButtonProps = {
	label?: string;
	onClick?: () => void;
	className?: string;
};

function Button({ label = "Get started", onClick, className = "" }: ButtonProps) {
	return (
		<button
			className={`landing-button ${className}`.trim()}
			onClick={onClick}
			type="button"
		>
			{label}
		</button>
	);
}

export { Button };