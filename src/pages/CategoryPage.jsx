import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import './CategoryPage.css';

function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryAndAchievements();
  }, [slug]);

  const fetchCategoryAndAchievements = async () => {
    try {
      const catResponse = await fetch(`${API_URL}/api/categories/${slug}`);
      const catData = await catResponse.json();
      setCategory(catData);

      const achResponse = await fetch(`${API_URL}/api/achievements?category_id=${catData.id}`);
      const achData = await achResponse.json();
      setAchievements(achData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!category) {
    return <div className="error">Category not found</div>;
  }

  return (
    <div className="category-page">
      {category.featured_image && (
        <div className="category-hero">
          <img src={`${API_URL}/uploads/${category.featured_image}`} alt={category.name} />
          <div className="category-hero-overlay">
            <h1>{category.name}</h1>
          </div>
        </div>
      )}
      <div className="category-header">
        <Link to="/achievements" className="back-link">&larr; Back to Categories</Link>
        {!category.featured_image && <h1>{category.name}</h1>}
        <p>{category.description}</p>
      </div>

      <div className="achievements-list">
        {achievements.length === 0 ? (
          <p className="no-achievements">No achievements in this category yet.</p>
        ) : (
          achievements.map(achievement => (
            <Link
              key={achievement.id}
              to={`/achievement/${achievement.id}`}
              className="achievement-card"
            >
              {achievement.featured_image && (
                <img src={`${API_URL}/uploads/${achievement.featured_image}`} alt={achievement.title} className="achievement-image" />
              )}
              <div className="achievement-content">
                <h2>{achievement.title}</h2>
                {achievement.date && (
                  <span className="achievement-date">{new Date(achievement.date).toLocaleDateString()}</span>
                )}
                <p>{achievement.description}</p>
                {achievement.gallery_images && achievement.gallery_images.length > 0 && (
                  <span className="gallery-indicator">📸 {achievement.gallery_images.length} more image{achievement.gallery_images.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
