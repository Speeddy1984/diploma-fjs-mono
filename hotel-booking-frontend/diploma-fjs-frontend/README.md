Пользователи:
Регистрация: POST /api/client/register
Создание пользователя (админ): POST /api/admin/users/
Получение списка пользователей для админа: GET /api/admin/users 
возможны параметры: ?email="string"&limit="integer"&offset="integer"
Вход (для всех): POST /api/auth/login
Выход: POST /api/auth/logout

Гостиницы и номера:
Публично: GET /api/common/hotel-rooms,
GET /api/common/hotel-rooms/:id
Административные действия: 
POST /api/admin/hotels, 
GET /api/admin/hotels, 
PUT /api/admin/hotels/:id, 
POST /api/admin/hotel-rooms, 
PUT /api/admin/hotel-rooms/:id

Бронирования:
Для клиента: 
POST /api/client/reservations, 
GET /api/client/reservations, 
DELETE /api/client/reservations/:id

Для менеджера: 
GET /api/manager/reservations/:userId, 
DELETE /api/manager/reservations/:id

Чат техподдержки:
Создание обращения: POST /api/client/support-requests
Получение списка обращений: 
GET /api/client/support-requests (для клиента),
GET /api/manager/support-requests (для менеджера)

История сообщений: GET /api/common/support-requests/:id/messages

Отправка сообщения: POST /api/common/support-requests/:id/messages

Отметка сообщений как прочитанных: POST /api/common/support-requests/:id/messages/read