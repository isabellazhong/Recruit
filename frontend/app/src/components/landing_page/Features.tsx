type Feature = {
    title: string;
    copy: string;
    detail:string; 
}
interface LandingPageProps {
    feature_cards: Array<Feature>
}

export function LandingPageFeatures({feature_cards}: LandingPageProps) {
    return (
        <div>
            <div className="landing-section__header">
                <p className="landing-eyebrow">Why Recruit</p>
                <h2>One minimal canvas for every interview track.</h2>
                <p>
                    Stay in flow from behavioral storytelling to technical whiteboards without firing
                    up ten different tabs.
                </p>
            </div>
            <div className="landing-grid">
                {feature_cards.map((card) => (
                    <article className="landing-card" key={card.title}>
                        <span>{card.detail}</span>
                        <h3>{card.title}</h3>
                        <p>{card.copy}</p>
                    </article>
                ))}
            </div>
        </div>
    )
}