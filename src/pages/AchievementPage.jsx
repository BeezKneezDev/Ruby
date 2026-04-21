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

        {achievement.content_sections && achievement.content_sections.length > 0 && (
          <div className="achievement-sections">
            {achievement.content_sections.map((section, idx) => (
              <div key={idx} className="achievement-section">
                {section.media_url && (
                  <div className="section-media">
                    {section.media_type === 'video' ? (
                      <video controls preload="metadata">
                        <source src={section.media_url} />
                      </video>
                    ) : (
                      <img src={section.media_url} alt={section.title || `Section ${idx + 1}`} />
                    )}
                  </div>
                )}
                {section.title && <h2 className="section-title">{section.title}</h2>}
                {section.content && <p className="section-text">{section.content}</p>}
              </div>
            ))}
          </div>
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

        {achievement.video && (
          <div className="achievement-video">
            <h2>Video</h2>
            <video controls preload="metadata" style={{width: '100%', maxWidth: '800px'}}>
              <source src={achievement.video} />
              Your browser does not support the video tag.
            </video>
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
