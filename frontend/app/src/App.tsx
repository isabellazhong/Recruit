import { useState } from 'react'
import './App.css'

type Screen = 'menu' | 'resume' | 'behavioral' | 'tech'

const screenConfig: Record<Screen, { title: string; body: string }> = {
  menu: { title: 'Main Menu', body: 'Choose a feature to test.' },
  resume: {
    title: 'Resume Builder',
    body: 'Placeholder screen for building resume features.',
  },
  behavioral: {
    title: 'Behavioral Prep',
    body: 'Placeholder screen for behavioral question tooling.',
  },
  tech: {
    title: 'Technical Prep',
    body: 'Placeholder screen for technical interview tooling.',
  },
}

const featureOrder: Screen[] = ['resume', 'behavioral', 'tech']

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <main className="app-shell">
      {screen === 'menu' ? (
        <section className="panel">
          <h1>Interview Prep Hub</h1>
          <p>Pick a feature to visit and keep building from there.</p>
          <div className="button-grid">
            {featureOrder.map((feature) => (
              <button
                key={feature}
                className="primary-button"
                onClick={() => setScreen(feature)}
              >
                {screenConfig[feature].title}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel">
          <button className="link-button" onClick={() => setScreen('menu')}>
            ← Back to menu
          </button>
          <h2>{screenConfig[screen].title}</h2>
          <p>{screenConfig[screen].body}</p>
          <p className="hint">Use this area to plug in each feature’s UI.</p>
        </section>
      )}
    </main>
  )
}

export default App
