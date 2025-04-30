import React, { useState, FormEvent, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { adminCreateHotel, HotelData } from '../api/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddHotel: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const navigate = useNavigate();

  // Валидация. Название минимум 5 символов, описание минимум 100 символов.
  useEffect(() => {
    if (title.trim().length >= 5 && description.trim().length >= 100) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [title, description]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const hotelData: HotelData = {
        title: title.trim(),
        description: description.trim(),
      };
      const response = await adminCreateHotel(hotelData);
      console.log('Гостиница создана:', response);
      setSuccessMessage('Гостиница успешно создана!');
      // После успешного сохранения через 2 секунды перенаправляем на страницу со списком гостиниц
      setTimeout(() => {
        navigate('/hotels');
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка создания гостиницы');
      } else {
        setError('Ошибка создания гостиницы');
      }
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Добавить гостиницу</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
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
          {title && title.trim().length < 5 && (
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
          {description && description.trim().length < 100 && (
            <Form.Text className="text-danger">
              Описание должно содержать минимум 100 символов.
            </Form.Text>
          )}
        </Form.Group>
        <Button variant="primary" type="submit" disabled={!isValid} className="w-100">
          Сохранить
        </Button>
      </Form>
    </Container>
  );
};

export default AddHotel;
