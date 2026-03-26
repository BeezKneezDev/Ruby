import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './AchievementPage.css';

function AchievementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [achievement, setAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievement();
  }, [id]);

  const fetchAchievement = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/achievements/${id}`);
      const data = await response.json();
      setAchievement(data);
    } catch (error) {
      console.error('Failed to fetch achievement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!achievement) {
    return <div className="error">Achievement not found</div>;
  }

  return (
    <div className="achievement-page">
      <div className="achievement-header">
        <Link
          to={`/achievements/${achievement.category_slug}`}
          className="back-link"
        >
          &larr; Back to {achievement.category_name}
        </Link>
        <div className="achievement-title-row">
          <h1>{achievement.title}</h1>
          {achievement.status && (
            <span className={`status-badge status-${achievement.status}`}>
              {achievement.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
            </span>
          )}
        </div>
        {achievement.date && (
          <span className="achievement-date">
            {new Date(achievement.date).toLocaleDateString()}
          </span>
        )}
        {achievement.description && (
          <p className="achievement-description">{achievement.description}</p>
        )}
      </div>

      {achievement.featured_image && (
        <div className="achievement-featured-image">
          <img
            src={`http://localhost:3001/uploads/${achievement.featured_image}`}
            alt={achievement.title}
          />
        </div>
      )}

      {achievement.content && (
        <div
          className="achievement-content"
          dangerouslySetInnerHTML={{ __html: achievement.content }}
        />
      )}

      {achievement.gallery_images && achievement.gallery_images.length > 0 && (
        <div className="achievement-gallery">
          <h2>Gallery ({achievement.gallery_images.length} images)</h2>
          <div className="gallery-grid">
            {achievement.gallery_images.map((img, idx) => (
              <img
                key={idx}
                src={`http://localhost:3001/uploads/${img}`}
                alt={`Gallery ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AchievementPage;
