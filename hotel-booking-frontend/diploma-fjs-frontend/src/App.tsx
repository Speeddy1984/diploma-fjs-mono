import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import AddHotel from "./pages/AddHotel";
import UsersPageAdmin from "./pages/UsersPageAdmin";
import UsersPageManager from "./pages/UsersPageManager";
import LoginPage from "./pages/LoginPage";
import ReservationsPage from "./pages/ReservationsPage";
import HotelsPageAdmin from "./pages/HotelsPageAdmin";
import EditHotel from "./pages/EditHotel";
import HotelRoomsPage from "./pages/HotelRoomsPage";
import HotelRoomCreatePage from "./pages/HotelRoomCreatePage";
import EditHotelRoomPage from "./pages/EditHotelRoomPage";
import HotelRoomDetailPage from './pages/HotelRoomDetailPage';
import ReservationsPageManager from "./pages/ReservationsPageManager";
import SupportRequestsPageClient from "./pages/SupportRequestsPageClient";
import SupportRequestsPageManager from "./pages/SupportRequestsPageManager";
import ErrorPage from './components/ErrorPage';
import { useAppSelector } from "./store/hooks";
import "bootstrap/dist/css/bootstrap.min.css";

const App: React.FC = () => {
  // Из Redux получаем данные аутентификации
  const { user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(user);
  console.log('user в App.ts:', user)

  return (
      <div className="min-vh-100 bg-light" style={{ padding: "20px" }}>
        {/* Header */}
        <Header 
          isAuthenticated={isAuthenticated} 
          currentUser={user} 
        />

        <div className="grid-container mt-3">
           {/* Навигационное меню */}
           <div className="left-col">
            <div className="content p-2">
              <Navigation />
            </div>
          </div>

          {/* Основное содержимое */}
          <div className="right-col">
            <div className="content p-2">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/common/room/:id" element={<HotelRoomDetailPage />} />
                <Route path="/hotels" element={<HotelsPageAdmin />} />
                <Route path="/hotels/:id/edit" element={<EditHotel />} />
                <Route path="/add-hotel" element={<AddHotel />} />
                <Route path="/hotels/:hotelId/rooms" element={<HotelRoomsPage />} />
                <Route path="/hotels/:hotelId/rooms/create" element={<HotelRoomCreatePage />} />
                <Route path="/hotels/:hotelId/rooms/:roomId/edit" element={<EditHotelRoomPage />} />
                <Route path="/users" element={ user?.role === 'admin' ? <UsersPageAdmin /> : <UsersPageManager /> } />
                <Route path="/manager/reservations/:userId" element={<ReservationsPageManager />} />
                <Route path="/client/reservations" element={<ReservationsPage />} />
                <Route path="/client/support-requests" element={<SupportRequestsPageClient />} />
                <Route path="/manager/support-requests" element={<SupportRequestsPageManager />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/error/:code" element={<ErrorPage />} />
                <Route path="*" element={<Navigate to="/error/404" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
  );
};

export default App;
