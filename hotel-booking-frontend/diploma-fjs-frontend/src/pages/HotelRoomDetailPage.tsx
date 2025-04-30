import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Alert, Spinner, Card } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CalendarForm from '../components/CalendarForm';
import { getCommonHotelRoomById, clientCreateReservation } from '../api/api';
import { useAppSelector } from '../store/hooks';

interface Hotel {
  id: string;
  title: string;
  description?: string;
}

interface Room {
  id: string;
  description: string;
  images: string[];
  hotel: Hotel;
}

export interface ReservationData { 
  hotelId: string;
  hotelRoom: string; // ID номера
  startDate: string; // ISO строка
  endDate: string;   // ISO строка
}

const getImageUrl = (relativePath: string): string => {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  // приводим "uploads/..." или "/uploads/..." к "uploads/..."
  const clean = relativePath.replace(/^\/?uploads\//, 'uploads/');
  return `${base}/${clean}`;
};

const HotelRoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const queryStart = queryParams.get('start');
  const queryEnd = queryParams.get('end');

  // Получаем текущего пользователя из Redux
  const { user } = useAppSelector((state) => state.auth);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Состояния дат, поднимаем из CalendarForm
  const [checkInDate, setCheckInDate] = useState<Date | null>(queryStart ? new Date(queryStart) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(queryEnd ? new Date(queryEnd) : null);

  // Состояние для модального окна фото
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await getCommonHotelRoomById(id!);
        setRoom({
          id: data.id || data._id,
          description: data.description,
          images: data.images,
          hotel: {
            id: data.hotel?.id || data.hotel?._id,
            title: data.hotel?.title,
            description: data.hotel?.description,
          },
        });
      } catch (err) {
        console.error(err);
        setError('Ошибка загрузки данных номера');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleReserve = async () => {
    if (!room) return;
    if (!checkInDate || !checkOutDate) {
      alert('Пожалуйста, выберите даты заезда и выезда.');
      return;
    }
    const reservationData: ReservationData = {
      hotelId: room.hotel.id,
      hotelRoom: room.id,
      startDate: checkInDate.toISOString(),
      endDate: checkOutDate.toISOString(),
    };
    try {
      await clientCreateReservation(reservationData);
      alert('Бронирование успешно создано!');
      navigate('/client/reservations');
    } catch (err) {
      console.error(err);
      alert('Ошибка бронирования');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {room && (
        <>
          <h2>{room.hotel.title}</h2>
          <p>{room.description}</p>

          {/* Галерея изображений */}
          {room.images.length > 0 && (
            <Row className="mb-3">
              {room.images.map((img, i) => {
                const url = getImageUrl(img);
                return (
                  <Col key={i} xs={6} md={4} className="mb-3">
                    <Card>
                      <Card.Img
                        variant="top"
                        src={url}
                        style={{
                          objectFit: 'cover',
                          height: '150px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setModalImage(url);
                          setShowModal(true);
                        }}
                        alt={`Фото ${i + 1}`}
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* Выбор дат и кнопка бронирования — только клиентам */}
          {user?.role === 'client' && (
            <>
              <CalendarForm
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onDatesChange={({ checkInDate, checkOutDate }) => {
                  setCheckInDate(checkInDate);
                  setCheckOutDate(checkOutDate);
                }}
              />
              <div className="mt-3">
                <Button variant="primary" onClick={handleReserve}>
                  Зарезервировать
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Модальное окно просмотра картинки */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Body className="p-0">
          {modalImage && (
            <img
              src={modalImage}
              alt="Full view"
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default HotelRoomDetailPage;
