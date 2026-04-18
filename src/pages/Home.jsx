import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import './Home.css';

const galleryImages = [
  { src: '/20250814_161539.jpg', alt: 'Football team' },
  { src: '/20250711_185631.jpg', alt: 'Dance performance' },
  { src: '/20251024_124208.jpg', alt: 'Kapa haka' },
  { src: '/20251222_125531.jpg', alt: 'Dance competition' },
  { src: '/20251107_111100.jpg', alt: 'Legend of the Peak event' },
  { src: '/20251102_160327.jpg', alt: 'Player of the day' },
  { src: '/20251004_182657(0).jpg', alt: 'School disco' },
  { src: '/20251126_144135.jpg', alt: 'School talent show' },
  { src: '/20251107_083736.jpg', alt: 'Duathlon with Bodhi' },
  { src: '/20251124_183516.jpg', alt: 'Kapa haka performance' },
  { src: '/20251213_102700(0).jpg', alt: 'Dance group' },
  { src: '/Screenshot_20260226-100354_Photos.jpg', alt: 'Face painting at LPAC' },
  { src: '/Screenshot_20260226-101243_Photos.jpg', alt: 'Kapa haka outfit' },
  { src: '/20251102_160328.jpg', alt: 'Player of the day awards' },
];

function Home() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
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

  return (
    <div className="home">
      <section className="hero">
      </section>

      <section className="about-section">
        <h1>Ruby's Achievement Portfolio</h1>
        <p className="about-subtitle">Celebrating success, one achievement at a time</p>
        <p>
          Hi, I'm Ruby! I love keeping busy with all kinds of activities. I'm passionate about
          dance, kapa haka, and playing sports with my friends. Whether it's performing on stage,
          competing in duathlons, or playing football, I always give it my best.
        </p>
        <p>
          This portfolio tracks my progress towards earning my achievement bars at Lynmore School.
          Each bar has 9 challenges to complete across sports, arts, and citizenship.
        </p>
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

      <section className="gallery-section">
        <h2>Photo Gallery</h2>
        <div className="home-gallery-grid">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="home-gallery-item">
              <img src={img.src} alt={img.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
