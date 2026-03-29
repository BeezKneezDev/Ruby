import { useState, useEffect } from 'react';
import { Navigate, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
        <div className="dashboard-links">
          <Link to="/dashboard/achievements">Manage Achievements</Link>
          <Link to="/dashboard/categories">Manage Categories</Link>
        </div>
      </div>
      <div className="dashboard-content">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="achievements" element={<ManageAchievements />} />
          <Route path="categories" element={<ManageCategories />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="dashboard-home">
      <h1>Welcome to the Dashboard</h1>
      <p>Use the navigation above to manage your achievements and categories.</p>
      <div className="quick-links">
        <Link to="/dashboard/achievements" className="quick-link-card">
          <h3>Manage Achievements</h3>
          <p>Add, edit, or delete achievements</p>
        </Link>
        <Link to="/dashboard/categories" className="quick-link-card">
          <h3>Manage Categories</h3>
          <p>Add, edit, or delete categories</p>
        </Link>
      </div>
    </div>
  );
}

function ManageAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    date: '',
    status: 'completed'
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentFeatured, setCurrentFeatured] = useState(null);
  const [currentGallery, setCurrentGallery] = useState([]);

  useEffect(() => {
    fetchAchievements();
    fetchCategories();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements`);
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

    const url = editingId
      ? `${API_URL}/api/admin/achievements/${editingId}`
      : `${API_URL}/api/admin/achievements`;

    const method = editingId ? 'PUT' : 'POST';

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

      // For edits, specify whether to keep existing images
      if (editingId) {
        formDataToSend.append('keep_featured', (!featuredImage && currentFeatured) ? 'true' : 'false');
        formDataToSend.append('keep_gallery', (galleryImages.length === 0 && currentGallery.length > 0) ? 'true' : 'false');
      }

      const response = await fetch(url, {
        method,
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
      status: achievement.status || 'completed'
    });
    setCurrentFeatured(achievement.featured_image);
    setCurrentGallery(achievement.gallery_images || []);
    setFeaturedImage(null);
    setGalleryImages([]);
    setEditingId(achievement.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/achievements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchAchievements();
      } else {
        alert('Failed to delete achievement');
      }
    } catch (error) {
      console.error('Error deleting achievement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      category_id: '',
      date: '',
      status: 'completed'
    });
    setFeaturedImage(null);
    setGalleryImages([]);
    setCurrentFeatured(null);
    setCurrentGallery([]);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Achievements</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add New Achievement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
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
              <option value="completed">Completed</option>
              <option value="uncompleted">Uncompleted</option>
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
            {currentFeatured && !featuredImage && (
              <div className="current-image">
                <img src={`${currentFeatured}`} alt="Current featured" style={{maxWidth: '200px', marginBottom: '10px'}} />
                <p style={{fontSize: '0.9rem', color: '#666'}}>Current featured image</p>
              </div>
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
            {currentGallery.length > 0 && galleryImages.length === 0 && (
              <div className="current-gallery">
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px'}}>
                  {currentGallery.map((img, idx) => (
                    <img key={idx} src={`${img}`} alt={`Gallery ${idx}`} style={{maxWidth: '100px', height: '100px', objectFit: 'cover'}} />
                  ))}
                </div>
                <p style={{fontSize: '0.9rem', color: '#666'}}>Current gallery images ({currentGallery.length})</p>
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
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Create'} Achievement
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {achievements.length === 0 ? (
          <p className="no-items">No achievements yet. Create your first one!</p>
        ) : (
          achievements.map(achievement => (
            <div key={achievement.id} className="item-card">
              <div className="item-content">
                <h3>{achievement.title}</h3>
                <span className="item-meta">{achievement.category_name} • {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'No date'}</span>
                <p>{achievement.description}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(achievement)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(achievement.id)} className="btn-delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [currentFeatured, setCurrentFeatured] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: editingId ? formData.slug : generateSlug(name)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `${API_URL}/api/admin/categories/${editingId}`
      : `${API_URL}/api/admin/categories`;

    const method = editingId ? 'PUT' : 'POST';

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('description', formData.description || '');

      if (featuredImage) {
        formDataToSend.append('featured_image', featuredImage);
      }

      // For edits, specify whether to keep existing image
      if (editingId) {
        formDataToSend.append('keep_featured', (!featuredImage && currentFeatured) ? 'true' : 'false');
      }

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        fetchCategories();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setCurrentFeatured(category.featured_image);
    setFeaturedImage(null);
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all achievements in this category!')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: ''
    });
    setFeaturedImage(null);
    setCurrentFeatured(null);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Categories</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add New Category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Featured Image</label>
            {currentFeatured && !featuredImage && (
              <div className="current-image">
                <img src={`${currentFeatured}`} alt="Current featured" style={{maxWidth: '200px', marginBottom: '10px'}} />
                <p style={{fontSize: '0.9rem', color: '#666'}}>Current featured image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFeaturedImage(e.target.files[0])}
            />
            {featuredImage && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>New image selected: {featuredImage.name}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Create'} Category
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {categories.length === 0 ? (
          <p className="no-items">No categories yet. Create your first one!</p>
        ) : (
          categories.map(category => (
            <div key={category.id} className="item-card">
              <div className="item-content">
                <h3>{category.name}</h3>
                <span className="item-meta">/{category.slug}</span>
                <p>{category.description}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(category)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(category.id)} className="btn-delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
