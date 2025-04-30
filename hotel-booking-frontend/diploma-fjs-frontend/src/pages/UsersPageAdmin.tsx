import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { Container, Form, Button, Alert, Table, Modal } from 'react-bootstrap';
import { adminCreateUser, adminGetUsers, SearchUserParams } from '../api/api';
import axios from 'axios';

export interface UserData {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  contactPhone?: string;
  role: 'client' | 'admin' | 'manager';
}

const UsersPageAdmin: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchContact, setSearchContact] = useState('');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Состояние для модального окна добавления пользователя
  const [showModal, setShowModal] = useState<boolean>(false);
  // Поля формы для нового пользователя
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newRole, setNewRole] = useState<'client' | 'admin' | 'manager'>('client');

  // Пагинация
  const [page, setPage] = useState<number>(0);
  const limit = 5;

  // Функция загрузки пользователей
  const fetchUsersAdmin = useCallback(async (params: SearchUserParams) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminGetUsers(params);
      const processed = (data as UserData[]).map((u: UserData) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        contactPhone: u.contactPhone,
        role: u.role,
      }));
      setUsers(processed);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(err);
        setError(err.response?.data?.message || 'Ошибка загрузки пользователей');
      } else {
        console.error(err);
        setError('Ошибка загрузки пользователей');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Обработчик поиска, сохраняет параметры и сбрасывает страницу
  const handleSearch = useCallback((e?: FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);
    const params: SearchUserParams = {
      email: searchEmail,
      name: searchName,
      contactPhone: searchContact,
      limit,
      offset: 0,
    };
    fetchUsersAdmin(params);
  }, [searchEmail, searchName, searchContact, limit, fetchUsersAdmin]);

  // Эффект для обновления данных при изменении страницы
  useEffect(() => {
    const params: SearchUserParams = {
      email: searchEmail,
      name: searchName,
      contactPhone: searchContact,
      limit,
      offset: page * limit,
    };
    fetchUsersAdmin(params);
  }, [page, searchEmail, searchName, searchContact, limit, fetchUsersAdmin]);

  // Первичная загрузка при монтировании
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Обработчик создания нового пользователя
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newUserData = {
        name: newName,
        email: newEmail,
        password: newPassword,
        contactPhone: newContactPhone,
        role: newRole,
      };
      const response = await adminCreateUser(newUserData);
      console.log('Пользователь успешно создан:', response);
      setShowModal(false);
      setPage(0);
      handleSearch();
      // Очистка формы
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewContactPhone('');
      setNewRole('client');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка создания пользователя');
      } else {
        setError('Ошибка создания пользователя');
      }
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Пользователи (Admin)</h2>
      
      {/* Кнопка для открытия модального окна */}
      <Button variant="success" className="mb-3" onClick={() => setShowModal(true)}>
        Добавить пользователя
      </Button>      

      <Form onSubmit={handleSearch} className="d-flex mb-3">
        <Form.Control
          type="text"
          placeholder="Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="me-2"
        />
        <Form.Control
          type="text"
          placeholder="Имя"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="me-2"
        />
        <Form.Control
          type="text"
          placeholder="Телефон"
          value={searchContact}
          onChange={(e) => setSearchContact(e.target.value)}
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
                <th>№ п/п</th>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1 + page * limit}</td>
                  <td>{user.name}</td>
                  <td>{user.contactPhone}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
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
              disabled={users.length < limit}
            >
              Вперёд
            </Button>
          </div>
        </>
      )}

      {/* Модальное окно для добавления пользователя */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить пользователя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3" controlId="createUserName">
              <Form.Label>Введите имя</Form.Label>
              <Form.Control
                type="text"
                placeholder="Имя"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="createUserEmail">
              <Form.Label>Введите email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="createUserPassword">
              <Form.Label>Введите пароль</Form.Label>
              <Form.Control
                type="password"
                placeholder="Пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="createUserContactPhone">
              <Form.Label>Введите контактный телефон</Form.Label>
              <Form.Control
                type="text"
                placeholder="Телефон"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="createUserRole">
              <Form.Label>Роль</Form.Label>
              <Form.Select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as 'client' | 'admin' | 'manager')
                }
                required
              >
                <option value="client">client</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Добавить пользователя
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UsersPageAdmin;