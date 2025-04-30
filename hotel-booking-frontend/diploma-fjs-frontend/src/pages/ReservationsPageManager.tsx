import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { managerGetReservations, managerCancelReservation } from '../api/api';
import axios from 'axios';

interface HotelRoom {
  description: string;
  images: string[];
}

interface Hotel {
  title: string;
  description: string;
}

export interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  hotelRoom: HotelRoom;
  hotel?: Hotel;
}

interface RawReservation {
  id: string;
  startDate: string;
  endDate: string;
  hotelRoom: {
    description: string;
    images: string[];
  };
  hotel: {
    title: string;
    description: string;
  };
}

const ReservationsPageManager: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  console.log(userId);
  const location = useLocation();
  const userName = new URLSearchParams(location.search).get('name') || '';
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const navigate = useNavigate();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await managerGetReservations(userId!);
      console.log('data', data);
      const processed: Reservation[] = (data as RawReservation[]).map((item) => ({
        id: item.id,
        startDate: item.startDate,
        endDate: item.endDate,
        hotelRoom: item.hotelRoom,
        hotel: item.hotel,
      }));
      console.log(processed);
      setReservations(processed);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка загрузки пользователей');
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancel = async (id: string) => {
    try {
      await managerCancelReservation(id);
      setMessage('Бронь успешно отменена');
      await fetchReservations();
    } catch (err: unknown) {
      console.error(err);
      alert('Ошибка при отмене бронирования');
    }
  };

  return (
    <Container className="mt-5">
      <h3>Бронирования пользователя: {userName}</h3>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : reservations.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Дата заезда</th>
              <th>Дата выезда</th>
              <th>Отель</th>
              <th>Номер</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id}>
                <td>{new Date(res.startDate).toLocaleDateString()}</td>
                <td>{new Date(res.endDate).toLocaleDateString()}</td>
                <td>{res.hotel?.title || 'Нет данных'}</td>
                <td>{res.hotelRoom.description}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancel(res.id)}
                  >
                    Отменить бронь
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>Нет броней</p>
      )}

      <div className="d-flex justify-content-between align-items-center mt-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Вернуться назад
        </Button>
      </div>
    </Container>
  );
};

export default ReservationsPageManager;
