import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import { API_URL } from '../config';
import './Dashboard.css';

function Dashboard({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <h2>Dashboard</h2>
      </div>
      <div className="dashboard-content">
        <ManageAchievements />
      </div>
    </div>
  );
}

function ManageAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    date: '',
    status: 'uncompleted'
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [currentFeatured, setCurrentFeatured] = useState(null);
  const [currentGallery, setCurrentGallery] = useState([]);
  const [removeFeatured, setRemoveFeatured] = useState(false);
  const [removedGalleryIndices, setRemovedGalleryIndices] = useState(new Set());

  useEffect(() => {
    fetchAchievements();
    fetchCategories();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements?status=all`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('content', formData.content || '');
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('status', formData.status);

      if (featuredImage) {
        formDataToSend.append('featured_image', featuredImage);
      }

      if (galleryImages.length > 0) {
        galleryImages.forEach(img => {
          formDataToSend.append('gallery_images', img);
        });
      }

      if (removeFeatured && !featuredImage) {
        formDataToSend.append('keep_featured', 'false');
      } else {
        formDataToSend.append('keep_featured', (!featuredImage && currentFeatured) ? 'true' : 'false');
      }

      const filteredGallery = currentGallery.filter((_, idx) => !removedGalleryIndices.has(idx));
      formDataToSend.append('existing_gallery', JSON.stringify(filteredGallery));
      formDataToSend.append('keep_gallery', (galleryImages.length === 0 && filteredGallery.length > 0) ? 'true' : 'false');

      if (checklist) {
        formDataToSend.append('checklist', JSON.stringify(checklist));
      }

      const response = await fetch(`${API_URL}/api/admin/achievements/${editingId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        fetchAchievements();
        resetForm();
      } else {
        alert('Failed to save achievement');
      }
    } catch (error) {
      console.error('Error saving achievement:', error);
      alert('Error saving achievement');
    }
  };

  const handleEdit = (achievement) => {
    setFormData({
      title: achievement.title,
      description: achievement.description || '',
      content: achievement.content || '',
      category_id: achievement.category_id,
      date: achievement.date || '',
      status: achievement.status || 'uncompleted'
    });
    setChecklist(achievement.checklist || null);
    setCurrentFeatured(achievement.featured_image);
    setCurrentGallery(achievement.gallery_images || []);
    setFeaturedImage(null);
    setGalleryImages([]);
    setRemoveFeatured(false);
    setRemovedGalleryIndices(new Set());
    setEditingId(achievement.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      category_id: '',
      date: '',
      status: 'uncompleted'
    });
    setChecklist(null);
    setFeaturedImage(null);
    setGalleryImages([]);
    setCurrentFeatured(null);
    setCurrentGallery([]);
    setRemoveFeatured(false);
    setRemovedGalleryIndices(new Set());
    setEditingId(null);
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Achievements</h2>
      </div>

      {editingId && (
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              readOnly
              className="read-only"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={getCategoryName(formData.category_id)}
              readOnly
              className="read-only"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="uncompleted">Uncompleted</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description (Short summary)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Main Content</label>
            <RichTextEditor
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val || '' })}
            />
          </div>
          <div className="form-group">
            <label>Featured Image</label>
            {currentFeatured && !featuredImage && !removeFeatured && (
              <div className="current-image">
                <div className="image-thumb-wrapper">
                  <img src={`${currentFeatured}`} alt="Current featured" style={{maxWidth: '200px', marginBottom: '10px'}} />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => {
                      setCurrentFeatured(null);
                      setRemoveFeatured(true);
                    }}
                    title="Remove featured image"
                  >&times;</button>
                </div>
                <p style={{fontSize: '0.9rem', color: '#666'}}>Current featured image</p>
              </div>
            )}
            {removeFeatured && !featuredImage && (
              <p style={{fontSize: '0.9rem', color: '#c0392b', marginBottom: '10px'}}>Featured image will be removed on save</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFeaturedImage(e.target.files[0])}
            />
            {featuredImage && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>New image selected: {featuredImage.name}</p>}
          </div>
          <div className="form-group">
            <label>Gallery Images (Select multiple)</label>
            {currentGallery.length > 0 && (
              <div className="current-gallery">
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px'}}>
                  {currentGallery.map((img, idx) => (
                    !removedGalleryIndices.has(idx) && (
                      <div key={idx} className="image-thumb-wrapper">
                        <img src={`${img}`} alt={`Gallery ${idx}`} style={{maxWidth: '100px', height: '100px', objectFit: 'cover'}} />
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => {
                            setRemovedGalleryIndices(prev => new Set([...prev, idx]));
                          }}
                          title="Remove this image"
                        >&times;</button>
                      </div>
                    )
                  ))}
                </div>
                <p style={{fontSize: '0.9rem', color: '#666'}}>
                  Current gallery images ({currentGallery.length - removedGalleryIndices.size})
                  {removedGalleryIndices.size > 0 && <span style={{color: '#c0392b'}}> — {removedGalleryIndices.size} marked for removal</span>}
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setGalleryImages(Array.from(e.target.files))}
            />
            {galleryImages.length > 0 && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>{galleryImages.length} new image(s) selected</p>}
          </div>
          {checklist && (
            <div className="form-group">
              <label>Checklist ({checklist.filter(item => item.trim() !== '').length}/{checklist.length} completed)</label>
              <div className="checklist-inputs">
                {checklist.map((item, idx) => (
                  <div key={idx} className="checklist-item">
                    <span className="checklist-number">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      placeholder={`Item ${idx + 1}`}
                      onChange={(e) => {
                        const updated = [...checklist];
                        updated[idx] = e.target.value;
                        setChecklist(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Update Achievement
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {achievements.length === 0 ? (
          <p className="no-items">No achievements found.</p>
        ) : (
          achievements.map(achievement => (
            <div key={achievement.id} className="item-card">
              <div className="item-content">
                <h3>
                  {achievement.title}
                  <span className={`status-badge status-${achievement.status}`}>
                    {achievement.status}
                  </span>
                </h3>
                <span className="item-meta">{achievement.category_name} • {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'No date'}</span>
                <p>{achievement.description}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(achievement)} className="btn-edit">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
