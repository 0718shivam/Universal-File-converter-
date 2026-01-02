import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Convertify</h2>
          
        </div>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Image Converter
          </Link>
          <Link
            to="/pdf"
            className={`nav-link ${location.pathname === '/pdf' ? 'active' : ''}`}
          >
            PDF Tools
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
