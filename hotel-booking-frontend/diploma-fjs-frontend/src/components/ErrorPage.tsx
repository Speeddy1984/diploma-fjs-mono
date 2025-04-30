import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

const messages: Record<string, string> = {
  '401': 'Требуется авторизация',
  '403': 'Доступ запрещён',
  '404': 'Ресурс не найден',
  '500': 'Внутренняя ошибка сервера',
};

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const title = `Ошибка ${code}`;
  const text = messages[code!] || 'Произошла непредвиденная ошибка';

  return (
    <Container className="mt-5 text-center">
      <h1>{title}</h1>
      <p>{text}</p>
      <Button onClick={() => navigate(-1)}>← Назад</Button>
    </Container>
  );
};

export default ErrorPage;
