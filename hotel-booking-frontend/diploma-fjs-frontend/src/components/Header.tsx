import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../features/authSlice';

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser: {
    name: string;
    role: 'client' | 'manager' | 'admin';
  } | null;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, currentUser }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-2 bg-light border-bottom">
      <div>
        <h4>Logo</h4>
      </div>
      <div>
        {isAuthenticated && currentUser ? (
          <div className="d-flex align-items-center">
            <span className="me-3">
              {currentUser.name} {currentUser.role}
            </span>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Войти
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;
