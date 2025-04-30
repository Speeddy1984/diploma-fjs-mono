import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { Container, Form, Button, Alert, Table } from "react-bootstrap";
import { adminGetHotels } from "../api/api";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Интерфейс отеля, возвращаемого сервером
interface Hotel {
  id: string;
  title: string;
  description?: string;
}

const HotelsPageAdmin: React.FC = () => {
  // Состояние для поиска по названию гостиницы
  const [searchTitle, setSearchTitle] = useState("");
  // Состояние списка отелей
  const [hotels, setHotels] = useState<Hotel[]>([]);
  // Состояния загрузки и ошибок
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  // Состояние пагинации
  const [page, setPage] = useState<number>(0);
  const limit = 5; // Ограничение на 5 записей на страницу

  const navigate = useNavigate();

  const fetchHotels = useCallback(
    async (params: { title?: string; limit: number; offset: number }) => {
      setLoading(true);
      setError("");
      try {
        const data = await adminGetHotels(params);
        const processed = (data as Hotel[]).map((hotel: Hotel) => ({
          id: hotel.id,
          title: hotel.title,
          description: hotel.description,
        }));
        setHotels(processed);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error(err);
          setError(err.response?.data?.message || "Ошибка загрузки гостиниц");
        } else {
          console.error(err);
          setError("Ошибка загрузки гостиниц");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Обработчик формы поиска. При отправке сбрасываем страницу на 0 и отправляем новый запрос.
  const handleSearch = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      setPage(0);
      const params = {
        title: searchTitle,
        limit,
        offset: 0,
      };
      fetchHotels(params);
    },
    [searchTitle, limit, fetchHotels]
  );

  // Эффект для обновления данных при изменении страницы (page) или поискового запроса
  useEffect(() => {
    const params = {
      title: searchTitle,
      limit,
      offset: page * limit,
    };
    fetchHotels(params);
  }, [page, searchTitle, limit, fetchHotels]);

  // Первичная загрузка при монтировании
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Список гостиниц</h2>

      {/* Кнопка для добавления гостиницы */}
      <Button
        variant="success"
        className="mb-3"
        onClick={() => navigate("/add-hotel")}
      >
        Добавить гостиницу
      </Button>

      {/* Форма поиска */}
      <Form onSubmit={handleSearch} className="d-flex mb-3">
        <Form.Control
          type="text"
          placeholder="Введите название гостиницы"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="me-2"
        />
        <Button variant="primary" type="submit">
          Искать
        </Button>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>№</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel, index) => (
                <tr key={hotel.id}>
                  <td>{index + 1 + page * limit}</td>
                  <td>{hotel.title}</td>
                  <td>{hotel.description}</td>
                  <td>
                    <div className="d-flex justify-content-center">
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        style={{ minWidth: "150px" }}
                        onClick={() => navigate(`/hotels/${hotel.id}/edit`)}
                      >
                        Редактировать
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        style={{ minWidth: "150px" }}
                        onClick={() => navigate(`/hotels/${hotel.id}/rooms`)}
                      >
                        Посмотреть номера
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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
              disabled={hotels.length < limit}
            >
              Вперёд
            </Button>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              ← Вернуться назад
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default HotelsPageAdmin;
