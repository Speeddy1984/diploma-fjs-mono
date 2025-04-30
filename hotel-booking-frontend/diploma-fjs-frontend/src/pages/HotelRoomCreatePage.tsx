import React, { useState, useCallback } from "react";
import {
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateHotelRoom } from "../api/api";
import { useDropzone, FileRejection } from "react-dropzone";

const MAX_IMAGES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10 Мб
const MIN_DIM = 1000;
const MAX_DIM = 5000;

const HotelRoomCreatePage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  console.log("HotelId из URL:", hotelId);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  // Хранение выбранных файлов
  const [images, setImages] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Функция проверки размеров изображения
  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        console.log(img.width, img.height);
        const isValid =
          img.width >= MIN_DIM &&
          img.width <= MAX_DIM &&
          img.height >= MIN_DIM &&
          img.height <= MAX_DIM;
        URL.revokeObjectURL(objectUrl);
        console.log("isValid? :", isValid, MIN_DIM, MAX_DIM);
        resolve(isValid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };
    });
  };

  // onDrop функция с типизацией для rejected файлов
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setGlobalError(null);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      // Обработка отклонённых файлов
      rejectedFiles.forEach((fileRejection) => {
        fileRejection.errors.forEach((err) => {
          newErrors.push(`Файл "${fileRejection.file.name}": ${err.message}`);
        });
      });

      // Обработка принятых файлов
      for (const file of acceptedFiles) {
        if (file.size > MAX_SIZE) {
          newErrors.push(`Файл "${file.name}" превышает максимальный размер.`);
          continue;
        }
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
          newErrors.push(`Файл "${file.name}" имеет неправильные размеры.`);
          continue;
        }
        validFiles.push(file);
      }

      setImages((prev) => {
        const combined = [...prev, ...validFiles];
        return combined.slice(0, MAX_IMAGES);
      });
      setFileErrors(newErrors);
    },
    []
  );

  // Настройка react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: MAX_IMAGES,
  });

  // Обработчик показа модального окна с полноразмерным изображением
  const handleImageClick = (url: string) => {
    setModalImage(url);
    setShowModal(true);
  };

  // Удаление файла из массива
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10 || images.length === 0) {
      setGlobalError(
        "Описание должно быть не менее 10 символов и необходимо добавить минимум одно изображение."
      );
      return;
    }
    const formData = new FormData();
    formData.append("hotelId", hotelId!);
    formData.append("description", description.trim());
    images.forEach((file) => {
      formData.append("images", file);
    });
    try {
      await adminCreateHotelRoom(formData);
      navigate(`/hotels/${hotelId}/rooms`);
    } catch (error) {
      console.error(error);
      setGlobalError("Ошибка создания номера");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Добавить номер</h2>
      {globalError && <Alert variant="danger">{globalError}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Drag & Drop для фото */}
        <Form.Group className="mb-3">
          <Form.Label>Фото (минимум 1, максимум 10)</Form.Label>
          <div
            {...getRootProps()}
            style={{
              border: "2px dashed #ccc",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Отпустите файлы здесь ...</p>
            ) : (
              <p>Перетащите файлы или кликните для выбора</p>
            )}
          </div>
          {fileErrors.length > 0 && (
            <div className="mt-2">
              {fileErrors.map((err, index) => (
                <Alert key={index} variant="danger" className="py-1">
                  {err}
                </Alert>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <Row className="mt-3">
              {images.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <Col key={index} xs={4} className="mb-3">
                    <img
                      src={url}
                      alt={file.name}
                      style={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      onClick={() => handleImageClick(url)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="mt-1 w-100"
                      onClick={() => removeImage(index)}
                    >
                      Удалить
                    </Button>
                  </Col>
                );
              })}
            </Row>
          )}
          {images.length >= MAX_IMAGES && (
            <Alert variant="info">
              Добавление новых изображений недоступно, достигнуто максимальное
              количество ({MAX_IMAGES}).
            </Alert>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Описание номера (минимум 10 символов)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            isInvalid={
              description.trim().length > 0 && description.trim().length < 10
            }
          />
          <Form.Control.Feedback type="invalid">
            Описание должно содержать минимум 10 символов.
          </Form.Control.Feedback>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            variant="primary"
            type="submit"
            disabled={description.trim().length < 10 || images.length === 0}
          >
            Сохранить
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/hotels/${hotelId}/rooms`)}
          >
            Отменить
          </Button>
        </div>
      </Form>

      {/* Модальное окно для полноразмерного просмотра изображения */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Body>
          {modalImage && (
            <img src={modalImage} alt="full" style={{ width: "100%" }} />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default HotelRoomCreatePage;
