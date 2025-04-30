import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { clientGetReservations, clientCancelReservation } from '../api/api';

// Интерфейсы для данных бронирования
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
  hotel: Hotel;
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

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clientGetReservations();
      console.log('data', data);
      const processed = (data as RawReservation[]).map((item) => ({
        id: item.id,
        startDate: item.startDate,
        endDate: item.endDate,
        hotelRoom: item.hotelRoom,
        hotel: item.hotel,
      }));
      console.log(processed);
      setReservations(processed);
    } catch (err: unknown) {
      setError('Ошибка загрузки бронирований');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const cancelReservation = async (id: string) => {
    try {
      await clientCancelReservation(id);
      setMessage('Бронь успешно отменена');
      // Обновляем список броней после удаления
      fetchReservations();
    } catch (err: unknown) {
      setError('Ошибка отмены бронирования');
      console.error(err);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Список броней</h2>
      {loading && <Spinner animation="border" className="m-5" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      {reservations.length > 0 ? (
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
            {reservations.map((res) => (
              <tr key={res.id}>
                <td>{new Date(res.startDate).toLocaleDateString()}</td>
                <td>{new Date(res.endDate).toLocaleDateString()}</td>
                <td>{res.hotel ? res.hotel.title : 'Нет данных'}</td>
                <td>{res.hotelRoom ? res.hotelRoom.description : 'Нет данных'}</td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => cancelReservation(res.id)}>
                    Отменить бронь
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        !loading && <p>Нет броней</p>
      )}
    </Container>
  );
};

export default ReservationsPage;
