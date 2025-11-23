import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import "../../pages/home_page/HomePage.css";

type ButtonProps = {
	label?: string;
	onClick?: () => void;
	icon?: ReactNode;
	className?: string;
	disabled?: boolean;
};

export function Button({
	label = "Open workspace",
	onClick,
	icon,
	className = "",
	disabled = false,
}: ButtonProps) {
	const renderedIcon = icon ?? <ArrowUpRight size={16} aria-hidden="true" />;

	return (
		<button
			type="button"
			className={`workspace-button ${className}`.trim()}
			onClick={onClick}
			disabled={disabled}
		>
			<span className="workspace-button__label">{label}</span>
			{renderedIcon}
		</button>
	);
}
