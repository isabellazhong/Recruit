import { Button } from "./Button";
import { useNavigate } from "react-router-dom";

type HeroProps = {
  onPrimaryAction?: () => void;
};

const HERO_STATS = [
  { label: "Candidates coached", value: "4,800+" },
  { label: "Avg. prep hours saved", value: "12" },
  { label: "Teams hiring", value: "120" },
];

const HERO_STEPS = [
  "Summarize your resume into confident talking points.",
  "Generate behavioral prompts tailored to each company.",
  "Practice delivery and body language with instant feedback.",
];

export function Hero({ onPrimaryAction }: HeroProps) {
  const navigate = useNavigate();
  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }
    navigate("/home");
  };

  return (
    <section className="landing-hero">
      <div className="landing-hero__text">
        <p className="landing-eyebrow">Calm, minimal interview prep</p>
        <h1 className="landing-hero__title">
          Find your next role with a focused workspace built for practice.
        </h1>
        <p className="landing-hero__copy">
          Re-imagine job applications with Recruit.
        </p>
        <div className="landing-hero__actions">
          <Button label="Enter workspace" onClick={handlePrimary} />
        </div>
        <div className="landing-hero__stats">
          {HERO_STATS.map((stat) => (
            <div className="landing-hero__stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="landing-hero__panel">
        <p className="landing-hero__panel-label">Workflow snapshot</p>
        <ul>
          {HERO_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}