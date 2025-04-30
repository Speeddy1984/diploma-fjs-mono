#### Это монорепозиторий для системы бронирования гостиниц с техподдержкой, состоящий из двух сервисов:

Backend (hotel-booking-backend) на NestJS + MongoDB
Frontend (hotel-booking-frontend/diploma-fjs-frontend) на Vite + React

В корне расположен docker-compose.yml, который собирает и запускает оба сервиса вместе с MongoDB (БД находится в облаке Atlas).

## Структура репозитория

diploma-fjs-mono/
├── docker-compose.yml               # Описание сборки сервисов Docker
├── .gitignore                       # Игнорируемые файлы
├── hotel-booking-backend/           # Сервис NestJS
│   ├── src/                         # Исходный код (контроллеры, модули и т.д.)
│   ├── dist/                        # Собранный код (сборка производится внутри Docker)
│   ├── uploads/                     # Папка, куда сохраняются загруженные фото номеров
│   ├── .env                         # Переменные окружения для бэкенда
│   ├── Dockerfile                   # Инструкция сборки образа бэкенда
│   ├── package.json
│   └── tsconfig.json
└── hotel-booking-frontend/          # Сервис React (Vite)
    └── diploma-fjs-frontend/        # Фреймворк Vite + исходники
       ├── src/                     # Компоненты, страницы, API
       ├── Dockerfile               # Инструкция сборки образа фронтенда
       ├── .env                     # Переменные окружения для фронтенда
       ├── package.json
       └── tsconfig.json

## Настройка окружения
1. Backend
Перейдите в каталог hotel-booking-backend/ и создайте файл .env со следующими переменными:
# hotel-booking-backend/.env
# Подключение к MongoDB
MONGODB_URI=mongodb+srv://
USER_MONGO=speeddy1984
PASSWORD_MONGO=8dZnh1d9xCOJvgUg
MONGODB_DB=@diploma-cluster.1elyi.mongodb.net/
HTTP_HOST=localhost
HTTP_PORT=3000

2. Frontend
Перейдите в hotel-booking-frontend/diploma-fjs-frontend/ и создайте файл .env:
# hotel-booking-frontend/diploma-fjs-frontend/.env
# Адрес API бэкенда
VITE_API_URL=http://localhost:3000
# URL для WebSocket (чат)
VITE_SOCKET_URL=ws://localhost:3000/support

## Запуск через Docker Compose
1. Клонируйте репозиторий:
git clone https://github.com/Speeddy1984/diploma-fjs-mono.git
cd diploma-fjs-mono
Убедитесь, что файлы .env созданы в подпапках hotel-booking-backend/ и hotel-booking-frontend/diploma-fjs-frontend/.

2. Запустите все сервисы:
docker-compose up --build -d

3. Откройте приложение в браузере:
Frontend: http://localhost:5173

4. Данные для аутентификации пользователей с разными ролями:
Admin: логин: admin@test.com, пароль: qwerty
Manager: логин: manager@test.com, пароль: qwerty
Client: логин: client@test.com, пароль: qwerty