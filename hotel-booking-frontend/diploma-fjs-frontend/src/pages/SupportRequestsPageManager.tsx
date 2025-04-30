import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  Form,
} from "react-bootstrap";
import { format } from "date-fns";
import {
  managerGetSupportRequests,
  managerCloseSupportRequest,
  managerGetUnreadCount,
  getSupportMessages,
  sendSupportMessage,
  managerMarkMessagesAsRead,
  GetSupportRequestsParams,
  Message,
} from "../api/api";
import { io } from 'socket.io-client';

interface ManagerSupportRequestItem {
  id: string;
  createdAt: string;
  isActive: boolean;
  hasNewMessages: boolean;
  client: {
    id: string;
    name: string;
    email: string;
    contactPhone: string;
  };
}

interface EnrichedRequest extends ManagerSupportRequestItem {
  text: string;
  unreadCount: number;
}

const PAGE_LIMIT = 10;
const BASE_URL = import.meta.env.VITE_API_URL;

const SupportRequestsPageManager: React.FC = () => {
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);

  // Состояние для чата
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatText, setChatText] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: GetSupportRequestsParams = {
        limit: PAGE_LIMIT,
        offset: page * PAGE_LIMIT,
      };
      const rawList: ManagerSupportRequestItem[] =
        await managerGetSupportRequests(params);

      const enriched = await Promise.all(
        rawList.map(async (r) => {
          // получаем всю историю, чтобы взять первый текст
          const msgs = await getSupportMessages(r.id);
          const firstText = msgs[0]?.text || "";
          // считаем, сколько ещё непрочитанных менеджером
          const unread = await managerGetUnreadCount(r.id);
          console.log("unread ", unread, "id ", r.id);
          return {
            ...r,
            text: firstText,
            unreadCount: unread,
          } as EnrichedRequest;
        })
      );

      setRequests(enriched);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить обращения");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Подписывается на новые сообщения в чате
  useEffect(() => {
    if (!chatRequestId || !showChatModal) return;

    const socket = io(`${BASE_URL}/support`, { withCredentials: true });

    socket.emit('subscribeToChat', { chatId: chatRequestId });
    socket.on('newMessage', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [chatRequestId, showChatModal, fetchRequests]);

  const handleCloseRequest = async (id: string) => {
    if (!window.confirm("Вы действительно хотите закрыть обращение?")) return;
    try {
      await managerCloseSupportRequest(id);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Ошибка при закрытии обращения");
    }
  };

  const openChat = async (requestId: string) => {
    setChatLoading(true);
    try {
      // Помечаем старые сообщения прочитанными
      await managerMarkMessagesAsRead(requestId, {
        createdBefore: new Date().toISOString(),
      });

      // Получаем всю историю
      const msgs = await getSupportMessages(requestId);
      setChatMessages(msgs);

      // Обновляем счетчик в списке
      await fetchRequests();

      // Открываем модалку и подписываемся на WebSocket
      setChatRequestId(requestId);
      setShowChatModal(true);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки сообщений");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async () => {
    if (!chatText.trim() || !chatRequestId) return;
    try {
      await sendSupportMessage(chatRequestId, { text: chatText.trim() });
      setChatText("");
      const msgs = await getSupportMessages(chatRequestId);
      setChatMessages(msgs);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить сообщение');
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Обращения в техподдержку (менеджер)</h2>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Пользователь</th>
                <th>Создано</th>
                <th>Текст обращения</th>
                <th>Новые</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, idx) => (
                <tr key={r.id}>
                  <td>{page * PAGE_LIMIT + idx + 1}</td>
                  <td>{r.client.name}</td>
                  <td>{format(new Date(r.createdAt), "dd.MM.yyyy HH:mm")}</td>
                  <td>{r.text}</td>
                  <td>
                    {r.unreadCount > 0 ? (
                      <Badge bg="danger">{r.unreadCount}</Badge>
                    ) : (
                      <Badge bg="secondary">0</Badge>
                    )}
                  </td>
                  <td>{r.isActive ? "Активное" : "Закрыто"}</td>
                  <td className="d-flex gap-1">
                    {r.isActive && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleCloseRequest(r.id)}
                      >
                        Закрыть
                      </Button>
                    )}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openChat(r.id)}
                    >
                      Чат
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </Button>
            <span>Страница {page + 1}</span>
            <Button
              variant="outline-secondary"
              disabled={requests.length < PAGE_LIMIT}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        </>
      )}

      {/* Чат-модалка */}
      <Modal
        show={showChatModal}
        onHide={() => setShowChatModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Чат обращения</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {chatLoading ? (
            <Spinner />
          ) : (
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`d-flex mb-2 ${
                    m.author.role === "client"
                      ? "justify-content-start"
                      : "justify-content-end"
                  }`}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background:
                        m.author.role === "client" ? "#f8f9fa" : "#d1e7dd",
                    }}
                  >
                    <div>{m.text}</div>
                    <small className="text-muted">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Form.Group className="mt-3">
            <Form.Control
              as="textarea"
              rows={2}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Введите сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChatModal(false)}>
            Закрыть
          </Button>
          <Button
            variant="primary"
            disabled={!chatText.trim()}
            onClick={handleSend}
          >
            Отправить
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SupportRequestsPageManager;
