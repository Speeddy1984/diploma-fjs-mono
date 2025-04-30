1. Модуль «Пользователи»
Назначение: создание, хранение и поиск профилей пользователей.
Интерфейс сервиса (IUserService):

create(data: Partial<User>): Promise<User>
Создает пользователя.

findById(id: ID): Promise<User>
Находит пользователя по ID.

findByEmail(email: string): Promise<User>
Находит пользователя по email.

findAll(params: SearchUserParams): Promise<User[]>
Возвращает список пользователей с фильтрацией по частичному совпадению полей email, name и contactPhone.

API Endpoints (пример):

POST /api/auth/register (или /api/client/register)
Тело запроса:

{
  "email": "user@example.com",
  "password": "secret123",
  "name": "User Name",
  "contactPhone": "+1234567890",
  "role": "client"   // Для регистрации клиентов роль по умолчанию client
}
Формат ответа:

{
  "id": "603dcd1fb1e3f341e4f12345",
  "email": "user@example.com",
  "name": "User Name",
  "contactPhone": "+1234567890",
  "role": "client"
}
POST /api/auth/login
Тело запроса:

{
  "email": "user@example.com",
  "password": "secret123"
}
Формат ответа: (при использовании cookie-based сессии – ответ может содержать данные пользователя, а сессия устанавливается через cookie)

{
  "email": "user@example.com",
  "name": "User Name",
  "contactPhone": "+1234567890"
}
GET /api/admin/users
Доступ: только для пользователей с ролью admin
Параметры (Query): опционально, limit/offset и фильтры по email, name, contactPhone
Формат ответа:

[
  {
    "id": "603dcd1fb1e3f341e4f12345",
    "email": "user@example.com",
    "name": "User Name",
    "contactPhone": "+1234567890",
    "role": "client"
  },
  …
]
Аналогичный endpoint GET /api/manager/users (если реализован) для менеджеров с соответствующей фильтрацией.

2. Модуль «Гостиницы»
Назначение: хранение и поиск гостиниц и их номеров.
Модель Hotel:

Поля:

_id (ObjectId)

title (string) – название гостиницы

description (string, опционально)

createdAt, updatedAt (Date)

Модель HotelRoom:

Поля:

_id (ObjectId)

hotel (ObjectId, ссылка на Hotel)

description (string, опционально)

images (string[], по умолчанию пустой массив)

isEnabled (boolean, по умолчанию true)

createdAt, updatedAt (Date)

API Endpoints:

Public Endpoints (доступны всем, включая неаутентифицированных):

GET /api/common/hotel-rooms
Query-параметры:

limit — количество записей

offset — сдвиг

hotel (ID гостиницы, опционально)
При запросе, если пользователь не аутентифицирован или его роль client, применяется фильтрация по isEnabled: true.
Формат ответа:

[
  {
    "id": "603e1a2c4f1c2e001f234567",
    "description": "Номер стандарт",
    "images": ["/uploads/filename.jpg"],
    "hotel": {
      "id": "603e1a0b4f1c2e001f234560",
      "title": "Отель Европа"
    }
  },
  …
]
GET /api/common/hotel-rooms/:id
Возвращает подробную информацию о номере, включая данные о гостинице.
Формат ответа:

{
  "id": "603e1a2c4f1c2e001f234567",
  "description": "Номер стандарт",
  "images": ["/uploads/filename.jpg"],
  "hotel": {
    "id": "603e1a0b4f1c2e001f234560",
    "title": "Отель Европа",
    "description": "Находится в центре города"
  }
}
Административные Endpoints (требуют аутентификации с нужной ролью):

POST /api/admin/hotels/
Тело запроса:

{
  "title": "Отель Европа",
  "description": "Находится в центре города"
}
Ответ: объект гостиницы с её ID, title и description.

GET /api/admin/hotels/
Возвращает список гостиниц.

PUT /api/admin/hotels/:id
Тело запроса:

{
  "title": "Новое название",
  "description": "Новое описание"
}
Ответ: обновлённый объект гостиницы.

POST /api/admin/hotel-rooms/
Принимает multipart/form-data для загрузки изображений.
Тело запроса: поля:

description (string)

hotelId (string)

images[] (файлы)
Ответ: объект созданного номера с данными, включая populated данные гостиницы.

PUT /api/admin/hotel-rooms/:id
Принимает multipart/form-data для обновления номера.
Ответ: обновленный объект номера.

3. Модуль «Бронирование»
Назначение: хранение и получение бронирований номеров гостиниц.
Модель Reservation:

Поля:

_id (ObjectId)

userId (ObjectId)

hotelId (ObjectId)

roomId (ObjectId)

dateStart (Date)

dateEnd (Date)

createdAt, updatedAt (Date)

API Endpoints:

POST /api/client/reservations
Тело запроса (JSON):

{
  "hotelId": "603e1a0b4f1c2e001f234560",
  "hotelRoom": "603e1a2c4f1c2e001f234567",  // ID номера
  "startDate": "2025-04-10T00:00:00.000Z",
  "endDate": "2025-04-15T00:00:00.000Z"
}
Ответ: объект бронирования, содержащий информацию о номере, датах и гостинице.

GET /api/client/reservations
Возвращает список бронирований текущего клиента.

DELETE /api/client/reservations/:id
Отмена бронирования клиента.

GET /api/manager/reservations/:userId
Менеджер может получить список бронирований для указанного пользователя.

DELETE /api/manager/reservations/:id
Менеджер может отменить бронь по ID.

4. Модуль «Чат техподдержки»
Назначение: организация чата и поддержки, хранение сообщений.
Модель SupportRequest:

Поля:

_id (ObjectId)

user (ObjectId) – ID клиента, создавшего обращение

createdAt (Date)

messages (массив объектов Message)

isActive (boolean, по умолчанию true)

Модель Message:

Поля:

_id (ObjectId)

author (ObjectId) – ID отправителя

sentAt (Date)

text (string)

readAt (Date, опционально; сообщение считается прочитанным, если это поле заполнено)

API Endpoints:

POST /api/client/support-requests/
Тело запроса:

{
  "text": "Описание проблемы или вопрос"
}
Доступ: только для клиентов.
Ответ: массив с информацией о созданном обращении, например:

[
  {
    "id": "603edc30b1f3c642d0a67890",
    "createdAt": "2025-04-01T12:00:00.000Z",
    "isActive": true,
    "hasNewMessages": true
  }
]
GET /api/client/support-requests/
Возвращает список обращений для текущего клиента.
Query-параметры: limit, offset, isActive.

GET /api/manager/support-requests/
Возвращает список обращений от клиентов.
Query-параметры: limit, offset, isActive.

GET /api/common/support-requests/:id/messages
Возвращает историю сообщений для данного обращения.
Ответ:

[
  {
    "id": "603edc30b1f3c642d0a67891",
    "createdAt": "2025-04-01T12:05:00.000Z",
    "text": "Первое сообщение",
    "readAt": null,
    "author": { "id": "603dcd1fb1e3f341e4f12345", "name": "User Name" }
  },
  ...
]
POST /api/common/support-requests/:id/messages
Тело запроса:

{
  "text": "Ответ в чате"
}
Доступ: Клиент или менеджер, которые имеют доступ к этому обращению.
Ответ: новое сообщение с populated данными автора.

POST /api/common/support-requests/:id/messages/read
Тело запроса:

{
  "createdBefore": "2025-04-01T12:10:00.000Z"
}
Доступ: Клиент или менеджер.
Функционал: обновляет все сообщения, отправленные до указанной даты, отмечая их как прочитанные.

Примечания по безопасности:
Аутентификация и авторизация:
Некоторые эндпоинты доступны только аутентифицированным пользователям с нужными ролями (client, manager, admin). Сервер использует сессионную аутентификацию, и необходимо передавать сессионные cookie в заголовке Authorization.

Валидация входящих данных:
Используются DTO (например, с помощью class-validator) для проверки правильности данных.