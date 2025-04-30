import React, { useState, useEffect, FormEvent } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card, Carousel, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CalendarForm from '../components/CalendarForm';
import { getCommonHotelRooms } from '../api/api';

interface Room {
  id: string;
  description: string;
  images: string[];
  hotel: {
    id: string;
    title: string;
    description?: string;
  };
}

interface HotelGroup {
  hotel: {
    id: string;
    title: string;
    description?: string;
  };
  rooms: Room[];
}

const Home: React.FC = () => {
  const [hotelName, setHotelName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 10;
  const navigate = useNavigate();

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  

  // Обработчик поиска
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await getCommonHotelRooms({
        hotel: hotelName,
        isEnabled: true,
        limit,
        offset: page * limit,
      });
      setRooms(data as Room[]);
    } catch (err) {
      console.error('Ошибка загрузки гостиниц:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Первичная загрузка при монтировании страницы
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getCommonHotelRooms({
          isEnabled: true,
          limit,
          offset: 0,
        });
        setRooms(data as Room[]);
      } catch (err) {
        console.error('Ошибка загрузки гостиниц:', err);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Группировка комнат по гостинице
  const hotelGroupsObj = rooms.reduce((groups: { [key: string]: HotelGroup }, room: Room) => {
    const hotelId = room.hotel.id;
    if (!groups[hotelId]) {
      groups[hotelId] = {
        hotel: room.hotel,
        rooms: [],
      };
    }
    groups[hotelId].rooms.push(room);
    return groups;
  }, {});
  
  const hotelGroups: HotelGroup[] = Object.values(hotelGroupsObj);

  const groupedData = Object.values(hotelGroups);

  const getImageUrl = (relativePath: string) => {
    return `${import.meta.env.VITE_API_URL}/${relativePath.replace(/^\/?uploads\//, 'uploads/')}`;
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Поиск гостиницы</h2>
      <Form onSubmit={handleSearch}>
        <Form.Group controlId="hotelName" className="mb-3">
          <Form.Control
            type="text"
            placeholder="Введите название гостиницы (необязательно)"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
          />
        </Form.Group>
        <CalendarForm
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          onDatesChange={({ checkInDate, checkOutDate }) => {
            setCheckInDate(checkInDate);
            setCheckOutDate(checkOutDate);
          }}
        />
        <Button variant="primary" type="submit" className="w-100 mb-4">
          Искать
        </Button>
      </Form>
      
      {loading && <Spinner animation="border" className="m-5" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {groupedData.length > 0 ? (
        groupedData.map((group) => (
          <div key={group.hotel.id} className="mb-5">
            <h3>{group.hotel.title}</h3>
            {group.hotel.description && <p>{group.hotel.description}</p>}
            <Row>
              {group.rooms.map((room) => (
                <Col key={room.id} md={6} lg={4} className="mb-4">
                  <Card>
                    {room.images && room.images.length > 0 && (
                      room.images.length === 1 ? (
                        <Card.Img
                          // variant="top"
                          // src={room.images[0]}
                          // style={{ objectFit: 'cover', height: '200px' }}
                          // alt={`Room ${room.id} image`}
                          variant="top"
                          src={getImageUrl(room.images[0])}
                          style={{ objectFit: 'cover', height: '200px' }}
                          alt={`Room ${room.id} image`}
                        />
                      ) : (
                        <Carousel interval={null} indicators={true}>
                          {room.images.map((img, index) => (
                            <Carousel.Item key={index}>
                              <img
                                // src={img}
                                // alt={`Room ${room.id} image ${index}`}
                                // style={{ objectFit: 'cover', height: '200px', width: '100%' }}
                                src={getImageUrl(img)}
                                alt={`Room ${room.id} image ${index}`}
                                style={{ objectFit: 'cover', height: '200px', width: '100%' }}
                              />
                            </Carousel.Item>
                          ))}
                        </Carousel>
                      )
                    )}
                    <Card.Body>
                      <Card.Text>{room.description}</Card.Text>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/common/room/${room.id}?start=${checkInDate ? checkInDate.toISOString() : ''}&end=${checkOutDate ? checkOutDate.toISOString() : ''}`
                          )
                        }
                      >
                        Подробнее
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))
      ) : (
        !loading && <p>Нет доступных номеров</p>
      )}

      {/* Пагинация */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <Button
          variant="secondary"
          onClick={() => setPage((prev) => Math.max(0, prev - 1))}
          disabled={page === 0}
        >
          Назад
        </Button>
        <span>Страница {page + 1}</span>
        <Button
          variant="secondary"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={rooms.length < limit}
        >
          Вперёд
        </Button>
      </div>
    </Container>
  );
};

export default Home;