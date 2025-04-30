import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      window.location.href = '/login';
    } else if ([403, 404, 500].includes(status)) {
      window.location.href = `/error/${status}`;
    }
    return Promise.reject(err);
  }
);

// АУТЕНТИФИКАЦИЯ, ПОЛЬЗОВАТЕЛИ

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  contactPhone?: string;
}

export interface SearchUserParams {
  email?: string;
  name?: string;
  contactPhone?: string;
  limit?: number;
  offset?: number;
}

// Регистрация клиента
export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(
    `${BASE_URL}/api/client/register`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Создание пользователя (админ)
export const adminCreateUser = async (data: RegisterData & { role: string }) => {
  const response = await axios.post(
    `${BASE_URL}/api/admin/users/`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Получение списка пользователей (админ)
export const adminGetUsers = async (params: SearchUserParams) => {
  const response = await axios.get(
    `${BASE_URL}/api/admin/users`,
    {
      params,
      withCredentials: true,
    }
  );
  return response.data;
};

// Получение списка пользователей (менеджер)
export const managerGetUsers = async (params: SearchUserParams) => {
  const response = await axios.get(
    `${BASE_URL}/api/manager/users`,
    {
      params,
      withCredentials: true,
    }
  );
  return response.data;
};

// Вход (авторизация)
export const login = async (data: LoginData) => {
  const response = await axios.post(
    `${BASE_URL}/api/auth/login`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Выход (logout)
export const logout = async () => {
  const response = await axios.post(
    `${BASE_URL}/api/auth/logout`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

// ГОСТИНИЦЫ И НОМЕРА

// Публичный эндпоинт: получить список номеров
export interface GetHotelRoomsParams {
  limit?: number;
  offset?: number;
  hotel?: string;
  isEnabled?: boolean;
}

export const getCommonHotelRooms = async (params: GetHotelRoomsParams) => {
  const response = await axios.get(
    `${BASE_URL}/api/common/hotel-rooms`,
    { params, withCredentials: true }
  );
  console.log('Параметры getCommonHotelRooms ', params);
  return response.data;
};

// Получить подробную информацию о номере
export const getCommonHotelRoomById = async (id: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/common/hotel-rooms/${id}`,
    { withCredentials: true }
  );
  return response.data;
};

// Административные эндпоинты для гостиниц
export interface HotelData {
  title: string;
  description?: string;
}

export const adminCreateHotel = async (data: HotelData) => {
  const response = await axios.post(
    `${BASE_URL}/api/admin/hotels`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const adminGetHotels = async (params?: { title?: string; limit?: number; offset?: number }) => {
  const response = await axios.get(
    `${BASE_URL}/api/admin/hotels`,
    { params, withCredentials: true }
  );
  console.log(response.data)
  return response.data;
};

export const adminGetHotelById = async (id: string) => {
  const response = await axios.get(`${BASE_URL}/api/admin/hotels/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const adminUpdateHotel = async (id: string, data: HotelData) => {
  const response = await axios.put(
    `${BASE_URL}/api/admin/hotels/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const adminCreateHotelRoom = async (data: FormData) => {
  const response = await axios.post(
    `${BASE_URL}/api/admin/hotel-rooms`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );
  return response.data;
};

export const adminUpdateHotelRoom = async (id: string, data: FormData) => {
  const response = await axios.put(
    `${BASE_URL}/api/admin/hotel-rooms/${id}`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );
  return response.data;
};

// БРОНИРОВАНИЯ

export interface ReservationData {
  hotelId: string;
  hotelRoom: string; // ID номера
  startDate: string; // ISO строка
  endDate: string;   // ISO строка
}

// Для клиента
export const clientCreateReservation = async (data: ReservationData) => {
  const response = await axios.post(
    `${BASE_URL}/api/client/reservations`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const clientGetReservations = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/client/reservations`,
    { withCredentials: true }
  );
  return response.data;
};

export const clientCancelReservation = async (id: string) => {
  const response = await axios.delete(
    `${BASE_URL}/api/client/reservations/${id}`,
    { withCredentials: true }
  );
  return response.data;
};

// Для менеджера
export const managerGetReservations = async (userId: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/manager/reservations/${userId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const managerCancelReservation = async (id: string) => {
  const response = await axios.delete(
    `${BASE_URL}/api/manager/reservations/${id}`,
    { withCredentials: true }
  );
  return response.data;
};

// ЧАТ ТЕХПОДДЕРЖКИ
export interface SupportRequestData {
  text: string;
}

export const clientCreateSupportRequest = async (data: SupportRequestData) => {
  const response = await axios.post(
    `${BASE_URL}/api/client/support-requests`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export interface GetSupportRequestsParams {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

export interface SupportRequestListItem {
  id: string;
  createdAt: string;
  isActive: boolean;
  hasNewMessages: boolean;
}
export interface Message {
  id: string;
  createdAt: string;
  text: string;
  readAt?: string;
  author: { id: string; name: string; role: 'client' | 'manager' | 'admin'; };
}

export interface CreateSupportRequestDto {
  text: string;
}

export const clientGetSupportRequests = async (params: GetSupportRequestsParams) => {
  const response = await axios.get(
    `${BASE_URL}/api/client/support-requests`,
    { params, withCredentials: true }
  );
  return response.data;
};

export const managerGetSupportRequests = async (params: GetSupportRequestsParams) => {
  const response = await axios.get(
    `${BASE_URL}/api/manager/support-requests`,
    { params, withCredentials: true }
  );
  return response.data;
};

// История сообщений из чата
export const getSupportMessages = async (supportRequestId: string) => {
  const response = await axios.get(
    `${BASE_URL}/api/common/support-requests/${supportRequestId}/messages`,
    { withCredentials: true }
  );
  return response.data;
};

// Отправка сообщения
export const sendSupportMessage = async (supportRequestId: string, data: { text: string }) => {
  const response = await axios.post(
    `${BASE_URL}/api/common/support-requests/${supportRequestId}/messages`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Пометка прочитанными — для клиента
export const clientMarkMessagesAsRead = async (
  supportRequestId: string,
  data: { createdBefore: string }
) => {
  const response = await axios.post(
    `${BASE_URL}/api/client/support-requests/${supportRequestId}/messages/read`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Пометка прочитанными — для менеджера
export const managerMarkMessagesAsRead = async (
  supportRequestId: string,
  data: { createdBefore: string }
) => {
  const response = await axios.post(
    `${BASE_URL}/api/manager/support-requests/${supportRequestId}/messages/read`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// Получение количества непрочитанных сообщений (клиент)
export const clientGetUnreadCount = async (supportRequestId: string): Promise<number> => {
  const { data } = await axios.get<{ count: number }>(
    `${BASE_URL}/api/client/support-requests/${supportRequestId}/unread-count`,
    { withCredentials: true }
  )
  return data.count
}

// Получение количества непрочитанных сообщений (менеджер)
export const managerGetUnreadCount = async (supportRequestId: string): Promise<number> => {
  const { data } = await axios.get<{ count: number }>(
    `${BASE_URL}/api/manager/support-requests/${supportRequestId}/unread-count`,
    { withCredentials: true }
  )
  return data.count
}

// Закрытие обращения (менеджер)
export const managerCloseSupportRequest = async (supportRequestId: string): Promise<void> => {
  await axios.post(
    `${BASE_URL}/api/manager/support-requests/${supportRequestId}/close`,
    {},
    { withCredentials: true }
  )
}