import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import './Achievements.css';

function Achievements() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();

      // Fetch achievement counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (cat) => {
          const achResponse = await fetch(`${API_URL}/api/achievements?category_id=${cat.id}`);
          const achievements = await achResponse.json();
          return { ...cat, count: achievements.length };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="achievements">
      <h1>Achievement Categories</h1>
      <p className="subtitle">Explore achievements by category</p>

      <div className="category-grid">
        {categories.map(category => (
          <Link
            key={category.id}
            to={`/achievements/${category.slug}`}
            className="category-card"
          >
            {category.featured_image && (
              <div className="category-image">
                <img src={`${category.featured_image}`} alt={category.name} />
              </div>
            )}
            <div className="category-content">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <span className="achievement-count">{category.count} achievement{category.count !== 1 ? 's' : ''}</span>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="no-data">No categories available yet.</p>
      )}
    </div>
  );
}

export default Achievements;
