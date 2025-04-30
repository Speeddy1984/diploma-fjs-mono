import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

const Navigation: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  console.log("USER Nav: ", user);
  return (
    <nav className="nav flex-column">
      {/* Ссылка "Поиск номера" показывается всем, в т.ч. неавторизованным */}
      <Link to="/" className="nav-link">
        Поиск номера
      </Link>

      {/* Для клиента */}
      {user && user.role === "client" && (
        <>
          <Link to="/client/reservations" className="nav-link">
            Список броней
          </Link>
          <Link to="/client/support-requests" className="nav-link">
            Обращения в техподдержку
          </Link>
        </>
      )}

      {/* Для admin */}
      {user && user.role === "admin" && (
        <>
          <Link to="/hotels" className="nav-link">
            Список гостиниц
          </Link>
          <Link to="/users" className="nav-link">
            Пользователи
          </Link>
        </>
      )}

      {/* Для manager */}
      {user && user.role === "manager" && (
        <>
          <Link to="/users" className="nav-link">
            Пользователи
          </Link>
          <Link to="/manager/support-requests" className="nav-link">
            Обращения в техподдержку
          </Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;
