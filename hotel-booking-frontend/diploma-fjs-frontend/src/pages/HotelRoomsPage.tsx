import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Alert,
  Carousel,
} from "react-bootstrap";
import { adminGetHotelById, getCommonHotelRooms } from "../api/api";

interface Room {
  id: string;
  description: string;
  images: string[];
}

interface Hotel {
  id: string;
  title: string;
  description: string;
}

interface RawRoom {
  _id: string;
  description: string;
  images: string[];
  id?: string;
}

const HotelRoomsPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const limit = 5;

  const navigate = useNavigate();

  console.log("HotelRoomsPage hotelId", hotelId);

  const getImageUrl = (relativePath: string) => {
    return `${import.meta.env.VITE_API_URL}/${relativePath.replace(/^\/?uploads\//, 'uploads/')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelData = await adminGetHotelById(hotelId!);
        setHotel({
          id: hotelData._id,
          title: hotelData.title,
          description: hotelData.description,
        });
        const roomData = await getCommonHotelRooms({
          hotel: hotelId!,
          limit,
          offset: page * limit,
        });
        console.log("roomData", roomData);
        const processedRooms = (roomData as RawRoom[]).map((room) => ({
          id: room.id || room._id,
          description: room.description,
          images: room.images,
        }));
        setRooms(processedRooms);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hotelId, page, limit]);

  if (loading) return <Spinner animation="border" className="m-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="mt-4">
      <h2>{hotel?.title}</h2>
      <p>{hotel?.description}</p>
      <Button
        variant="primary"
        className="mb-4"
        onClick={() => navigate(`/hotels/${hotelId}/rooms/create`)}
      >
        Добавить номер
      </Button>
      <Row>
        {rooms.map((room) => (
          <Col key={room.id} md={6} lg={4} className="mb-4">
            <Card>
              {room.images &&
                room.images.length > 0 &&
                (room.images.length === 1 ? (
                  <Card.Img
                    variant="top"
                    src={getImageUrl(room.images[0])}
                    style={{ objectFit: "cover", height: "200px" }}
                    alt={`Room ${room.id} image`}
                  />
                ) : (
                  <Carousel interval={null} indicators={true}>
                    {room.images.map((img, index) => (
                      <Carousel.Item key={index}>
                        <img
                          src={getImageUrl(img)}
                          alt={`Room ${room.id} image ${index}`}
                          style={{
                            objectFit: "cover",
                            height: "200px",
                            width: "100%",
                          }}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                ))}
              <Card.Body>
                <Card.Text>{room.description}</Card.Text>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() =>
                    navigate(`/hotels/${hotelId}/rooms/${room.id}/edit`)
                  }
                >
                  Редактировать
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

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
      <div className="d-flex justify-content-between align-items-center mt-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Вернуться назад
        </Button>
      </div>
    </Container>
  );
};

export default HotelRoomsPage;
