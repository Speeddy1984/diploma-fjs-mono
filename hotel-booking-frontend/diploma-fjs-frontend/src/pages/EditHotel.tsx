import React, { useState, useEffect, FormEvent } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { adminUpdateHotel, adminGetHotelById, HotelData } from '../api/api';
import axios from 'axios';

interface Hotel {
  _id: string;
  title: string;
  description?: string;
}

const EditHotel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Проверка валидации
  const isTitleValid = title.trim().length >= 5;
  const isDescriptionValid = description.trim().length >= 100;
  const isFormValid = isTitleValid && isDescriptionValid;

  // Загрузка данных гостиницы по id
  useEffect(() => {
    if (id) {
      setLoading(true);
      adminGetHotelById(id)
        .then((hotel: Hotel) => {
          setTitle(hotel.title);
          setDescription(hotel.description || '');
        })
        .catch((err) => {
          console.error(err);
          setError('Ошибка загрузки данных гостиницы');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid) return;
    try {
      const hotelData: HotelData = {
        title: title.trim(),
        description: description.trim(),
      };
      await adminUpdateHotel(id!, hotelData);
      setSuccessMessage('Гостиница успешно обновлена!');
      setTimeout(() => {
        navigate('/hotels');
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка обновления гостиницы');
      } else {
        setError('Ошибка обновления гостиницы');
      }
    }
  };

  const handleCancel = () => {
    navigate('/hotels');
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Редактирование гостиницы</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="hotelTitle" className="mb-3">
            <Form.Label>Название гостиницы</Form.Label>
            <Form.Control
              type="text"
              placeholder="Введите название гостиницы (минимум 5 символов)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {!isTitleValid && (
              <Form.Text className="text-danger">
                Название должно содержать минимум 5 символов.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="hotelDescription" className="mb-3">
            <Form.Label>Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Введите описание гостиницы (минимум 100 символов)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {!isDescriptionValid && (
              <Form.Text className="text-danger">
                Описание должно содержать минимум 100 символов.
              </Form.Text>
            )}
          </Form.Group>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={handleCancel}>
              Отменить
            </Button>
            <Button variant="primary" type="submit" disabled={!isFormValid}>
              Сохранить
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default EditHotel;
