import React, { useState, FormEvent, useEffect } from "react";
import { Container, Form, Button, Alert, Nav } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../features/authSlice";
import { LoginData, RegisterData } from "../api/api";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const LoginPage: React.FC = () => {
  const location = useLocation();
  // Устанавливаем начальный режим из location.state
  const initialMode =
    location.state?.mode === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Дополнительные поля для регистрации
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);

  // Эффект, чтобы обновлять режим, если location.state изменяется
  useEffect(() => {
    if (location.state?.mode === "login") {
      setMode("login");
    }
  }, [location.state]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const loginData: LoginData = { email, password };
      await dispatch(login(loginData)).unwrap();
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Ошибка входа");
      } else {
        setError("Ошибка входа");
      }
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const registerData: RegisterData = {
        email,
        password,
        name,
        contactPhone,
      };
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/client/register`,
        registerData,
        { withCredentials: true }
      );
      console.log("Регистрация прошла успешно:", response.data);
      // После регистрации переключаем режим на "login" через navigate.
      navigate("/login", { state: { mode: "login" } });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Ошибка регистрации");
      } else {
        setError("Ошибка регистрации");
      }
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "400px" }}>
      <Nav
        variant="tabs"
        activeKey={mode}
        onSelect={(key) => setMode(key as "login" | "register")}
      >
        <Nav.Item>
          <Nav.Link eventKey="login">Войти</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="register">Зарегистрироваться</Nav.Link>
        </Nav.Item>
      </Nav>
      <h3 className="my-3 text-center">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={mode === "login" ? handleLogin : handleRegister}>
        {mode === "register" && (
          <>
            <Form.Group controlId="registerName" className="mb-3">
              <Form.Label>Введите имя</Form.Label>
              <Form.Control
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="registerPhone" className="mb-3">
              <Form.Label>Введите контактный телефон</Form.Label>
              <Form.Control
                type="text"
                placeholder="Телефон"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </Form.Group>
          </>
        )}
        <Form.Group controlId="formEmail" className="mb-3">
          <Form.Label>Введите логин (email)</Form.Label>
          <Form.Control
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mb-3">
          <Form.Label>Введите пароль</Form.Label>
          <Form.Control
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button
          type="submit"
          variant="primary"
          className="w-100"
          disabled={loading}
        >
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </Button>
      </Form>
    </Container>
  );
};

export default LoginPage;
