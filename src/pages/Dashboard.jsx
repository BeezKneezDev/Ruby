import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../config';
import { normalizeSectionMedia } from '../utils';
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
        <ManageHomePage />
        <ManageMediaLibrary />
        <ManageAchievements />
      </div>
    </div>
  );
}

function ManageHomePage() {
  const [settings, setSettings] = useState({
    hero_image: '',
    home_title: '',
    home_subtitle: '',
    home_bio_1: '',
    home_bio_2: '',
  });
  const [heroFile, setHeroFile] = useState(null);
  const [removeHero, setRemoveHero] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('home_title', settings.home_title);
      formData.append('home_subtitle', settings.home_subtitle);
      formData.append('home_bio_1', settings.home_bio_1);
      formData.append('home_bio_2', settings.home_bio_2);
      if (heroFile) {
        formData.append('hero_image', heroFile);
      } else if (removeHero) {
        formData.append('remove_hero', 'true');
      }

      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
        setHeroFile(null);
        setRemoveHero(false);
        alert('Home page content saved!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Home Page Content</h2>
      </div>

      <form onSubmit={handleSave} className="crud-form">
        <div className="form-group">
          <label>Hero Background Image</label>
          {settings.hero_image && !removeHero && !heroFile && (
            <div className="current-image">
              <div className="image-thumb-wrapper">
                <img src={settings.hero_image} alt="Hero background" style={{maxWidth: '300px', marginBottom: '10px'}} />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setRemoveHero(true)}
                  title="Remove hero image"
                >&times;</button>
              </div>
              <p style={{fontSize: '0.9rem', color: '#666'}}>Current hero image</p>
            </div>
          )}
          {removeHero && !heroFile && (
            <p style={{fontSize: '0.9rem', color: '#c0392b', marginBottom: '10px'}}>Hero image will be removed on save</p>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setHeroFile(e.target.files[0]);
              setRemoveHero(false);
            }}
          />
          {heroFile && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>New image selected: {heroFile.name}</p>}
        </div>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={settings.home_title}
            onChange={(e) => setSettings({ ...settings, home_title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Subtitle</label>
          <input
            type="text"
            value={settings.home_subtitle}
            onChange={(e) => setSettings({ ...settings, home_subtitle: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Bio Paragraph 1</label>
          <textarea
            value={settings.home_bio_1}
            onChange={(e) => setSettings({ ...settings, home_bio_1: e.target.value })}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Bio Paragraph 2</label>
          <textarea
            value={settings.home_bio_2}
            onChange={(e) => setSettings({ ...settings, home_bio_2: e.target.value })}
            rows="4"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Home Page'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ManageMediaLibrary() {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/media`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      const response = await fetch(`${API_URL}/api/admin/media`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (response.ok) {
        fetchMedia();
      } else {
        alert('Failed to upload media');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Error uploading media');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this media item?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setMedia(prev => prev.filter(m => m.id !== id));
      } else {
        alert('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Media Library</h2>
      </div>

      <div className="crud-form">
        <div className="form-group">
          <label>Upload Images or Videos</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>Uploading...</p>}
        </div>

        {media.length > 0 && (
          <div className="media-grid">
            {media.map(item => (
              <div key={item.id} className="media-grid-item">
                <div className="image-thumb-wrapper">
                  {item.resource_type === 'video' ? (
                    <video src={item.url} style={{width: '100%', height: '120px', objectFit: 'cover'}} />
                  ) : (
                    <img src={item.url} alt={item.filename} style={{width: '100%', height: '120px', objectFit: 'cover'}} />
                  )}
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleDelete(item.id)}
                    title="Delete media"
                  >&times;</button>
                </div>
                <div className="media-grid-label">
                  <span className={`media-type-badge media-type-${item.resource_type}`}>{item.resource_type}</span>
                  {item.filename}
                </div>
              </div>
            ))}
          </div>
        )}

        {media.length === 0 && !uploading && (
          <p style={{color: '#666', textAlign: 'center', padding: '1rem 0'}}>No media uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

function MediaPickerModal({ isOpen, onClose, onSelect, mediaType, multiple }) {
  const [media, setMedia] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected([]);
      fetchMedia();
    }
  }, [isOpen, mediaType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const url = mediaType ? `${API_URL}/api/admin/media?type=${mediaType}` : `${API_URL}/api/admin/media`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (item) => {
    if (multiple) {
      setSelected(prev => {
        const exists = prev.find(s => s.id === item.id);
        if (exists) return prev.filter(s => s.id !== item.id);
        return [...prev, item];
      });
    } else {
      setSelected([item]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    if (multiple) {
      onSelect(selected.map(s => ({ url: s.url, type: s.resource_type || 'image' })));
    } else {
      onSelect(selected[0].url, selected[0].resource_type);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="media-picker-overlay" onClick={onClose}>
      <div className="media-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="media-picker-header">
          <h3>Choose from Media Library</h3>
          <button type="button" className="media-picker-close" onClick={onClose}>&times;</button>
        </div>
        <div className="media-picker-body">
          {loading && <p style={{textAlign: 'center', padding: '2rem', color: '#666'}}>Loading...</p>}
          {!loading && media.length === 0 && (
            <p style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              No {mediaType || 'media'} items found. Upload some in the Media Library section above.
            </p>
          )}
          {!loading && media.length > 0 && (
            <div className="media-picker-grid">
              {media.map(item => {
                const isSelected = selected.some(s => s.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`media-picker-item${isSelected ? ' media-picker-selected' : ''}`}
                    onClick={() => toggleSelect(item)}
                  >
                    {item.resource_type === 'video' ? (
                      <video src={item.url} style={{width: '100%', height: '100px', objectFit: 'cover'}} />
                    ) : (
                      <img src={item.url} alt={item.filename} style={{width: '100%', height: '100px', objectFit: 'cover'}} />
                    )}
                    {isSelected && <div className="media-picker-check">&#10003;</div>}
                    <div className="media-grid-label">{item.filename}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="media-picker-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleConfirm} disabled={selected.length === 0}>
            {multiple ? `Add ${selected.length} item${selected.length !== 1 ? 's' : ''}` : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageAchievements() {
  const editFormRef = useRef(null);
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    date: '',
    status: 'uncompleted'
  });
  const [contentSections, setContentSections] = useState([]);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [currentFeatured, setCurrentFeatured] = useState(null);
  const [currentGallery, setCurrentGallery] = useState([]);
  const [removeFeatured, setRemoveFeatured] = useState(false);
  const [removedGalleryIndices, setRemovedGalleryIndices] = useState(new Set());
  const [videoFile, setVideoFile] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [featuredFromLibrary, setFeaturedFromLibrary] = useState(false);
  const [videoFromLibrary, setVideoFromLibrary] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(null);

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
      formDataToSend.append('content', '');
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('status', formData.status);

      if (featuredImage) {
        formDataToSend.append('featured_image', featuredImage);
      } else if (featuredFromLibrary && currentFeatured) {
        formDataToSend.append('featured_image_url', currentFeatured);
      }

      if (galleryImages.length > 0) {
        galleryImages.forEach(img => {
          formDataToSend.append('gallery_images', img);
        });
      }

      if (videoFile) {
        formDataToSend.append('video', videoFile);
      } else if (videoFromLibrary && currentVideo) {
        formDataToSend.append('video_url', currentVideo);
      }

      if (removeVideo && !videoFile && !videoFromLibrary) {
        formDataToSend.append('keep_video', 'false');
      } else {
        formDataToSend.append('keep_video', (!videoFile && !videoFromLibrary && currentVideo) ? 'true' : 'false');
      }

      if (removeFeatured && !featuredImage && !featuredFromLibrary) {
        formDataToSend.append('keep_featured', 'false');
      } else {
        formDataToSend.append('keep_featured', (!featuredImage && !featuredFromLibrary && currentFeatured) ? 'true' : 'false');
      }

      const filteredGallery = currentGallery.filter((_, idx) => !removedGalleryIndices.has(idx));
      formDataToSend.append('existing_gallery', JSON.stringify(filteredGallery));
      formDataToSend.append('keep_gallery', (galleryImages.length === 0 && filteredGallery.length > 0) ? 'true' : 'false');

      if (checklist) {
        formDataToSend.append('checklist', JSON.stringify(checklist));
      }

      formDataToSend.append('content_sections', JSON.stringify(contentSections));

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
      category_id: achievement.category_id,
      date: achievement.date || '',
      status: achievement.status || 'uncompleted'
    });
    setContentSections((achievement.content_sections || []).map(normalizeSectionMedia));
    setChecklist(achievement.checklist || null);
    setCurrentFeatured(achievement.featured_image);
    setCurrentGallery(achievement.gallery_images || []);
    setCurrentVideo(achievement.video || null);
    setFeaturedImage(null);
    setGalleryImages([]);
    setVideoFile(null);
    setRemoveFeatured(false);
    setRemoveVideo(false);
    setRemovedGalleryIndices(new Set());
    setFeaturedFromLibrary(false);
    setVideoFromLibrary(false);
    setEditingId(achievement.id);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      date: '',
      status: 'uncompleted'
    });
    setContentSections([]);
    setChecklist(null);
    setFeaturedImage(null);
    setGalleryImages([]);
    setVideoFile(null);
    setCurrentFeatured(null);
    setCurrentGallery([]);
    setCurrentVideo(null);
    setRemoveFeatured(false);
    setRemoveVideo(false);
    setRemovedGalleryIndices(new Set());
    setFeaturedFromLibrary(false);
    setVideoFromLibrary(false);
    setEditingId(null);
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const handleLibraryPickFeatured = (url) => {
    setCurrentFeatured(url);
    setFeaturedImage(null);
    setFeaturedFromLibrary(true);
    setRemoveFeatured(false);
  };

  const handleLibraryPickGallery = (items) => {
    setCurrentGallery(prev => [...prev, ...items.map(i => typeof i === 'string' ? i : i.url)]);
  };

  const handleLibraryPickSection = (items, sectionIdx) => {
    const updated = [...contentSections];
    const existing = updated[sectionIdx].media || [];
    updated[sectionIdx] = { ...updated[sectionIdx], media: [...existing, ...items] };
    setContentSections(updated);
  };

  const handleLibraryPickVideo = (url) => {
    setCurrentVideo(url);
    setVideoFile(null);
    setVideoFromLibrary(true);
    setRemoveVideo(false);
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Achievements</h2>
      </div>

      {editingId && (
        <form ref={editFormRef} onSubmit={handleSubmit} className="crud-form">
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
              readOnly
              className="read-only"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Content Sections</label>
            <div className="content-sections-repeater">
              {contentSections.map((section, idx) => (
                <div key={idx} className="content-section-item">
                  <div className="content-section-header">
                    <span>Section {idx + 1}</span>
                    <button
                      type="button"
                      className="btn-remove-section"
                      onClick={() => setContentSections(prev => prev.filter((_, i) => i !== idx))}
                    >&times;</button>
                  </div>
                  <div className="content-section-fields">
                    <div className="form-group">
                      <label>Images / Videos</label>
                      {section.media && section.media.length > 0 && (
                        <div className="section-media-thumbs">
                          {section.media.map((m, mIdx) => (
                            <div key={mIdx} className="image-thumb-wrapper">
                              {m.type === 'video' ? (
                                <video src={m.url} style={{width: '100px', height: '80px', objectFit: 'cover'}} />
                              ) : (
                                <img src={m.url} alt="" style={{width: '100px', height: '80px', objectFit: 'cover'}} />
                              )}
                              <button
                                type="button"
                                className="btn-remove-image"
                                onClick={() => {
                                  const updated = [...contentSections];
                                  updated[idx] = { ...updated[idx], media: updated[idx].media.filter((_, i) => i !== mIdx) };
                                  setContentSections(updated);
                                }}
                                title="Remove media"
                              >&times;</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" className="btn-library" onClick={() => setPickerOpen(`section-${idx}`)}>
                        Choose from Library
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => {
                          const updated = [...contentSections];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setContentSections(updated);
                        }}
                        placeholder="Section title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Content</label>
                      <textarea
                        value={section.content || ''}
                        onChange={(e) => {
                          const updated = [...contentSections];
                          updated[idx] = { ...updated[idx], content: e.target.value };
                          setContentSections(updated);
                        }}
                        rows="4"
                        placeholder="Section content..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-section"
                onClick={() => setContentSections(prev => [...prev, { media: [], title: '', content: '' }])}
              >
                + Add Section
              </button>
            </div>
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
                      setFeaturedFromLibrary(false);
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
            <div className="media-input-row">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFeaturedImage(e.target.files[0]);
                  setFeaturedFromLibrary(false);
                }}
              />
              <button type="button" className="btn-library" onClick={() => setPickerOpen('featured')}>
                Choose from Library
              </button>
            </div>
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
            <div className="media-input-row">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryImages(Array.from(e.target.files))}
              />
              <button type="button" className="btn-library" onClick={() => setPickerOpen('gallery')}>
                Choose from Library
              </button>
            </div>
            {galleryImages.length > 0 && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>{galleryImages.length} new image(s) selected</p>}
          </div>
          <div className="form-group">
            <label>Video</label>
            {currentVideo && !videoFile && !removeVideo && (
              <div className="current-image">
                <div className="image-thumb-wrapper">
                  <video src={currentVideo} controls style={{maxWidth: '300px', maxHeight: '200px', marginBottom: '10px'}} />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => {
                      setCurrentVideo(null);
                      setRemoveVideo(true);
                      setVideoFromLibrary(false);
                    }}
                    title="Remove video"
                  >&times;</button>
                </div>
                <p style={{fontSize: '0.9rem', color: '#666'}}>Current video</p>
              </div>
            )}
            {removeVideo && !videoFile && (
              <p style={{fontSize: '0.9rem', color: '#c0392b', marginBottom: '10px'}}>Video will be removed on save</p>
            )}
            <div className="media-input-row">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  setVideoFile(e.target.files[0]);
                  setRemoveVideo(false);
                  setVideoFromLibrary(false);
                }}
              />
              <button type="button" className="btn-library" onClick={() => setPickerOpen('video')}>
                Choose from Library
              </button>
            </div>
            {videoFile && <p style={{fontSize: '0.9rem', color: '#667eea', marginTop: '5px'}}>New video selected: {videoFile.name}</p>}
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

      <MediaPickerModal
        isOpen={pickerOpen === 'featured'}
        onClose={() => setPickerOpen(null)}
        onSelect={handleLibraryPickFeatured}
        mediaType="image"
        multiple={false}
      />
      <MediaPickerModal
        isOpen={pickerOpen === 'gallery'}
        onClose={() => setPickerOpen(null)}
        onSelect={handleLibraryPickGallery}
        mediaType="image"
        multiple={true}
      />
      <MediaPickerModal
        isOpen={pickerOpen === 'video'}
        onClose={() => setPickerOpen(null)}
        onSelect={handleLibraryPickVideo}
        mediaType="video"
        multiple={false}
      />
      {contentSections.map((_, idx) => (
        <MediaPickerModal
          key={`section-picker-${idx}`}
          isOpen={pickerOpen === `section-${idx}`}
          onClose={() => setPickerOpen(null)}
          onSelect={(items) => handleLibraryPickSection(items, idx)}
          mediaType={null}
          multiple={true}
        />
      ))}

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
