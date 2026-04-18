import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import './Home.css';

function Home() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    hero_image: '/hero.jpg',
    home_title: '',
    home_subtitle: '',
    home_bio_1: '',
    home_bio_2: '',
  });

  useEffect(() => {
    fetchAchievements();
    fetchSettings();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const heroStyle = settings.hero_image
    ? {
        backgroundImage: `linear-gradient(to top, rgba(26, 60, 42, 0.85), rgba(26, 60, 42, 0.4)), url('${settings.hero_image}')`,
      }
    : {};

  return (
    <div className="home">
      <section className="hero" style={heroStyle}>
      </section>

      <section className="about-section">
        <h1>{settings.home_title}</h1>
        <p className="about-subtitle">{settings.home_subtitle}</p>
        {settings.home_bio_1 && <p>{settings.home_bio_1}</p>}
        {settings.home_bio_2 && <p>{settings.home_bio_2}</p>}
      </section>

      {!loading && achievements.length > 0 && (
        <section className="completed-section">
          <h2>Completed Achievements</h2>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <Link
                key={achievement.id}
                to={`/${achievement.category_slug}/${achievement.id}`}
                className="achievement-card"
              >
                {achievement.featured_image && (
                  <div className="achievement-card-image">
                    <img src={achievement.featured_image} alt={achievement.title} />
                  </div>
                )}
                <div className="achievement-card-content">
                  <span className="achievement-card-category">{achievement.category_name}</span>
                  <h3>{achievement.title}</h3>
                  {achievement.description && (
                    <p>{achievement.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
