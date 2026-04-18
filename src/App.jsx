import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import AchievementPage from './pages/AchievementPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { API_URL } from './config';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />}>
          <Route index element={<Home />} />
          <Route path=":slug" element={<CategoryPage />} />
          <Route path=":slug/:id" element={<AchievementPage />} />
          <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="dashboard" element={<Dashboard isAuthenticated={isAuthenticated} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
