import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { Container, Form, Button, Alert, Table } from "react-bootstrap";
import { managerGetUsers, SearchUserParams } from "../api/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export interface UserData {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  contactPhone?: string;
}

const UsersPageManager: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const limit = 5;

  const navigate = useNavigate();

  const handleViewReservations = (userId: string, name: string) => {
    console.log("UsersPageManager.tsx", userId);
    navigate(
      `/manager/reservations/${userId}?name=${encodeURIComponent(name)}`
    );
  };

  const fetchUsersManager = useCallback(
    async (params: SearchUserParams) => {
      setLoading(true);
      setError("");
      try {
        const data = await managerGetUsers({
          ...params,
          limit,
          offset: page * limit,
        });
        const processed = (data as UserData[]).map((u: UserData) => ({
          id: u._id || u.id,
          email: u.email,
          name: u.name,
          contactPhone: u.contactPhone,
        }));
        setUsers(processed);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error(err);
          setError(
            err.response?.data?.message || "Ошибка загрузки пользователей"
          );
        } else {
          console.error(err);
          setError("Ошибка загрузки пользователей");
        }
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  const handleSearch = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      setPage(0);
      fetchUsersManager({
        email: searchEmail,
        name: searchName,
        contactPhone: searchContact,
        limit,
        offset: 0,
      });
    },
    [searchEmail, searchName, searchContact, limit, fetchUsersManager]
  );

  // Эффект для обновления данных при изменении страницы или поисковых параметров.
  useEffect(() => {
    fetchUsersManager({
      email: searchEmail,
      name: searchName,
      contactPhone: searchContact,
      limit,
      offset: page * limit,
    });
  }, [page, searchEmail, searchName, searchContact, limit, fetchUsersManager]);

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Пользователи (Manager)</h2>

      <Form className="mb-3 d-flex flex-wrap">
        <Form.Control
          type="text"
          placeholder="Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="me-2 mb-2"
        />
        <Form.Control
          type="text"
          placeholder="Имя"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="me-2 mb-2"
        />
        <Form.Control
          type="text"
          placeholder="Телефон"
          value={searchContact}
          onChange={(e) => setSearchContact(e.target.value)}
          className="me-2 mb-2"
        />
        <Button variant="primary" onClick={handleSearch} className="mb-2">
          Искать
        </Button>
      </Form>

      {loading ? (
        <div>Загрузка...</div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>№ п/п</th>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Брони</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id || user._id}>
                  <td>{index + 1 + page * limit}</td>
                  <td>{user.name}</td>
                  <td>{user.contactPhone}</td>
                  <td>{user.email}</td>
                  <td>
                    <Button
                      variant="info"
                      onClick={() =>
                        handleViewReservations(user.id!, user.name)
                      }
                    >
                      Посмотреть
                    </Button>
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
              disabled={users.length < limit}
            >
              Вперёд
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default UsersPageManager;
