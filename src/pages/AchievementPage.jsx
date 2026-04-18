import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import './AchievementPage.css';

function AchievementPage() {
  const { id } = useParams();
  const [achievement, setAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievement();
  }, [id]);

  const fetchAchievement = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements/${id}`);
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
      {achievement.featured_image && (
        <div className="achievement-hero">
          <img src={achievement.featured_image} alt={achievement.title} />
        </div>
      )}

      <div className="achievement-body">
        <Link to={`/${achievement.category_slug}`} className="back-link">
          &larr; Back to {achievement.category_name}
        </Link>

        <span className="achievement-category-label">{achievement.category_name}</span>
        <h1>{achievement.title}</h1>

        <div className="achievement-meta">
          {achievement.date && (
            <span className="achievement-date">
              {new Date(achievement.date).toLocaleDateString()}
            </span>
          )}
          <span className={`status-badge status-${achievement.status}`}>
            {achievement.status === 'completed' ? 'Completed' : 'In Progress'}
          </span>
        </div>

        {achievement.description && (
          <p className="achievement-description">{achievement.description}</p>
        )}

        {achievement.content && (
          <div
            className="achievement-content"
            dangerouslySetInnerHTML={{ __html: achievement.content }}
          />
        )}

        {achievement.checklist && achievement.checklist.some(item => item.trim() !== '') && (
          <div className="achievement-checklist">
            <h2>Progress</h2>
            <ol>
              {achievement.checklist.map((item, idx) => (
                <li key={idx} className={item.trim() ? 'checklist-done' : 'checklist-empty'}>
                  {item.trim() || 'Not yet completed'}
                </li>
              ))}
            </ol>
          </div>
        )}

        {achievement.gallery_images && achievement.gallery_images.length > 0 && (
          <div className="achievement-gallery">
            <h2>Gallery</h2>
            <div className="gallery-grid">
              {achievement.gallery_images.map((img, idx) => (
                <img key={idx} src={img} alt={`Gallery ${idx + 1}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AchievementPage;
