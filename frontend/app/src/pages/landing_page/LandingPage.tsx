import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import { Hero } from "../../components/landing_page/Hero";
import { Button } from "../../components/landing_page/Button";
import { LandingPageFeatures } from "../../components/landing_page/Features";

const FEATURE_CARDS = [
	{
		title: "Behavioral question library",
		copy: "Surface prompts mapped to your experience with ready-to-use story beats.",
		detail: "Stories at the ready",
	},
	{
		title: "Technical workspace",
		copy: "Practice whiteboard explanations with AI that nudges clarity instead of buzzwords.",
		detail: "Clarity over jargon",
	},
	{
		title: "Resume polish",
		copy: "Reshape bullet points into concise, quantifiable statements in seconds.",
		detail: "Built-in editor",
	},
	{
		title: "Body-language review",
		copy: "Record quick takes, get lightweight cues on pacing, filler words, and presence.",
		detail: "Quick feedback",
	},
];

export default function LandingPage() {
	const navigate = useNavigate();
	const handlePrimaryAction = () => navigate("/home");

	return (
		<div className="landing-page">
			<div className="landing-shell">
				<header className="landing-nav">
					<div className="landing-logo">Recruit</div>
		
					<div className="landing-nav__actions">
		
						<Button
							label="GetStarted"
							onClick={handlePrimaryAction}
							className="landing-nav__cta"
						/>
					</div>
				</header>

				<Hero onPrimaryAction={handlePrimaryAction} />

				<section className="landing-section landing-section--features">
					<LandingPageFeatures feature_cards={FEATURE_CARDS}></LandingPageFeatures>
				</section>

				<footer className="landing-footer">
					<span>© {new Date().getFullYear()} Recruit </span>
				</footer>
			</div>
		</div>
	);
}
