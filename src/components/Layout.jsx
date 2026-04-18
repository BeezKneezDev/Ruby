import { Outlet, Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './Layout.css';

function Layout({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="nav-logo">Ruby's Achievements</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Ruby's Achievements. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;
