import React, { useState, useEffect, useCallback, DragEvent } from 'react';
import { Container, Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { adminUpdateHotelRoom, getCommonHotelRoomById } from '../api/api';
import { useDropzone, FileRejection } from 'react-dropzone';

const MAX_IMAGES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10 Мб
const MIN_DIM = 100;
const MAX_DIM = 2000;

interface HotelRoom {
  _id: string;
  description: string;
  images: string[];
}

const getImageUrl = (relativePath: string): string => {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const clean = relativePath.replace(/^\/?uploads\//, 'uploads/');
  console.log(`урл картинки ${base}/${clean}`)
  return `${base}/${clean}`;
};

const EditHotelRoomPage: React.FC = () => {
  // Получаем id гостиницы и номера из URL:
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  console.log('Отель:', hotelId, 'Номер:', roomId);
  const navigate = useNavigate();

  // Состояния для описания и изображений
  const [description, setDescription] = useState('');
  // Файлы, добавленные пользователем (новые)
  const [files, setFiles] = useState<File[]>([]);
  // URL-ы уже существующих изображений, полученных с сервера
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Для drag & drop переупорядочивания
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Загружаем исходные данные номера при монтировании
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const room: HotelRoom = await getCommonHotelRoomById(roomId!);
        setDescription(room.description);
        setExistingImages(room.images);
      } catch (err) {
        console.error(err);
        setGlobalError('Ошибка загрузки данных номера.');
      }
    };
    fetchRoomData();
  }, [roomId]);

  // Функция проверки размеров изображения
  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        const isValid =
          img.width >= MIN_DIM &&
          img.width <= MAX_DIM &&
          img.height >= MIN_DIM &&
          img.height <= MAX_DIM;
        URL.revokeObjectURL(objectUrl);
        resolve(isValid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };
    });
  };

  // Обработчик drop файлов (react-dropzone)
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

      // Проверяем accepted файлы
      for (const file of acceptedFiles) {
        if (file.size > MAX_SIZE) {
          newErrors.push(`Файл "${file.name}" превышает максимальный размер.`);
          continue;
        }
        const isValid = await validateImageDimensions(file);
        if (!isValid) {
          newErrors.push(`Файл "${file.name}" имеет неправильные размеры.`);
          continue;
        }
        validFiles.push(file);
      }

      setFiles((prev) => {
        const combined = [...prev, ...validFiles];
        return combined.slice(0, MAX_IMAGES);
      });
      setFileErrors(newErrors);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: MAX_IMAGES,
  });

// Функция для получения комбинированного массива превью:
const getAllImagePreviews = () => {
  const filePreviews = files.map((file) => URL.createObjectURL(file));
  const combined = [...existingImages, ...filePreviews].slice(0, MAX_IMAGES);
  return combined;
};

// Обработчик клика по изображению для открытия модального окна
const handleImageClick = (url: string) => {
  setModalImage(url);
  setShowModal(true);
};

// Функция для удаления изображения
const removeImage = (index: number) => {
  if (index < existingImages.length) {
    const newExisting = existingImages.filter((_, i) => i !== index);
    console.log(`Удаление из existingImages: индекс ${index}. Новый массив:`, newExisting);
    setExistingImages(newExisting);
  } else {
    const fileIndex = index - existingImages.length;
    const newFiles = files.filter((_, i) => i !== fileIndex);
    console.log(`Удаление из files: индекс ${fileIndex}. Новый массив:`, newFiles);
    setFiles(newFiles);
  }
  console.log('Общий комбинированный массив после удаления:', getAllImagePreviews());
};

// Обработчик начала перетаскивания
const handleDragStart = (_e: DragEvent<HTMLDivElement>, index: number) => {
  console.log('Начало перетаскивания, индекс:', index);
  setDragIndex(index);
};

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

// Обработчик переупорядочивания
const handleDropReorder = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
  e.preventDefault();
  if (dragIndex === null) return;
  console.log(`Перетаскивание: начальный индекс ${dragIndex}, индекс для сброса ${dropIndex}`);
  const combined = getAllImagePreviews();
  const reordered = [...combined];
  const [removed] = reordered.splice(dragIndex, 1);
  reordered.splice(dropIndex, 0, removed);
  console.log('Новый порядок превью после перетаскивания:', reordered);

  // Если перетаскивание происходит среди существующих изображений, обновляем existingImages
  if (dragIndex < existingImages.length || dropIndex < existingImages.length) {
    const newExisting = reordered.slice(0, existingImages.length);
    console.log('Обновлённый порядок existingImages:', newExisting);
    setExistingImages(newExisting);
  } else {
    // Перетаскивание среди новых файлов
    const filesCopy = [...files];
    const fileDragIndex = dragIndex - existingImages.length;
    const fileDropIndex = dropIndex - existingImages.length;
    const [removedFile] = filesCopy.splice(fileDragIndex, 1);
    filesCopy.splice(fileDropIndex, 0, removedFile);
    console.log('Обновлённый порядок files:', filesCopy);
    setFiles(filesCopy);
  }
  setDragIndex(null);
  console.log('Общий комбинированный массив после переупорядочивания:', getAllImagePreviews());
};

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10 || (existingImages.length + files.length) === 0) {
      setGlobalError('Описание должно быть не менее 10 символов и добавить минимум одно изображение.');
      return;
    }
    const formData = new FormData();
    formData.append('description', description.trim());
    formData.append('hotelId', hotelId!);
    // Передаем обновлнный порядок существующих изображений
    formData.append('existingImages', JSON.stringify(existingImages));
    // Передаем новые файлы
    files.forEach((file) => {
      formData.append('images', file);
    });
    try {
      await adminUpdateHotelRoom(roomId!, formData);
      navigate(`/hotels/${hotelId}/rooms`);
    } catch (error) {
      console.error(error);
      setGlobalError('Ошибка обновления номера');
    }
  };

  return (
    <Container className="mt-4">
      <h2>Редактировать номер</h2>
      {globalError && <Alert variant="danger">{globalError}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Фото (1–10)</Form.Label>
          <div
            {...getRootProps()}
            style={{ border: '2px dashed #ccc', padding: 20, cursor: 'pointer' }}
          >
            <input {...getInputProps()} />
            {isDragActive ? <p>Отпустите файлы</p> : <p>Перетащите или кликните</p>}
          </div>
          {fileErrors.map((e,i) => (
            <Alert key={i} variant="danger" className="py-1">{e}</Alert>
          ))}

          {getAllImagePreviews().length > 0 && (
            <Row className="mt-3">
              {getAllImagePreviews().map((url, i) => (
                <Col key={i} xs={4} className="mb-3">
                  <div
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropReorder(e, i)}
                  >
                    {/* Визуализация через getImageUrl, если это существующее */}
                    <img
                      src={ existingImages[i] 
                        ? getImageUrl(existingImages[i]) 
                        : url }
                      alt={`Preview ${i}`}
                      style={{ width: '100%', height: 100, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => handleImageClick(
                        existingImages[i]
                          ? getImageUrl(existingImages[i])
                          : url
                      )}
                    />
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-1 w-100"
                    onClick={() => removeImage(i)}
                  >
                    Удалить
                  </Button>
                </Col>
              ))}
            </Row>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Описание (≥10 символов)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            isInvalid={description.trim().length > 0 && description.trim().length < 10}
          />
          <Form.Control.Feedback type="invalid">
            Минимум 10 символов.
          </Form.Control.Feedback>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            variant="primary"
            type="submit"
            disabled={description.trim().length < 10 || existingImages.length + files.length === 0}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Body className="p-0">
          {modalImage && (
            <img
              src={modalImage}
              alt="full"
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );

  // return (
  //   <Container className="mt-4">
  //     <h2>Редактировать номер</h2>
  //     {globalError && <Alert variant="danger">{globalError}</Alert>}
      
  //     <Form onSubmit={handleSubmit}>
  //       {/* Drag & Drop для фото */}
  //       <Form.Group className="mb-3">
  //         <Form.Label>Фото (минимум 1, максимум 10)</Form.Label>
  //         <div
  //           {...getRootProps()}
  //           style={{
  //             border: '2px dashed #ccc',
  //             padding: '20px',
  //             textAlign: 'center',
  //             cursor: 'pointer',
  //           }}
  //         >
  //           <input {...getInputProps()} />
  //           {isDragActive ? (
  //             <p>Отпустите файлы здесь ...</p>
  //           ) : (
  //             <p>Перетащите файлы или кликните для выбора</p>
  //           )}
  //         </div>
  //         {fileErrors.length > 0 && (
  //           <div className="mt-2">
  //             {fileErrors.map((err, index) => (
  //               <Alert key={index} variant="danger" className="py-1">
  //                 {err}
  //               </Alert>
  //             ))}
  //           </div>
  //         )}
  //         {(existingImages.length + files.length) > 0 && (
  //           <Row className="mt-3">
  //             {getAllImagePreviews().map((url, index) => (
  //               <Col key={index} xs={4} className="mb-3">
  //                 <div
  //                   draggable
  //                   onDragStart={(e) => handleDragStart(e, index)}
  //                   onDragOver={handleDragOver}
  //                   onDrop={(e) => handleDropReorder(e, index)}
  //                 >
  //                   <img
  //                     src={url}
  //                     alt={`Preview ${index}`}
  //                     style={{ width: '100%', height: 100, objectFit: 'cover', cursor: 'pointer' }}
  //                     onClick={() => handleImageClick(url)}
  //                   />
  //                 </div>
  //                 <Button variant="danger" size="sm" className="mt-1 w-100" onClick={() => removeImage(index)}>
  //                   Удалить
  //                 </Button>
  //               </Col>
  //             ))}
  //           </Row>
  //         )}
  //         {(existingImages.length + files.length) >= MAX_IMAGES && (
  //           <Alert variant="info">
  //             Добавление новых изображений недоступно, достигнуто максимальное количество ({MAX_IMAGES}).
  //           </Alert>
  //         )}
  //       </Form.Group>

  //       <Form.Group className="mb-3">
  //         <Form.Label>Описание номера (минимум 10 символов)</Form.Label>
  //         <Form.Control
  //           as="textarea"
  //           rows={3}
  //           value={description}
  //           onChange={(e) => setDescription(e.target.value)}
  //           isInvalid={description.trim().length > 0 && description.trim().length < 10}
  //         />
  //         <Form.Control.Feedback type="invalid">
  //           Описание должно содержать минимум 10 символов.
  //         </Form.Control.Feedback>
  //       </Form.Group>

  //       <div className="d-flex gap-2">
  //         <Button variant="primary" type="submit" disabled={description.trim().length < 10 || (existingImages.length + files.length) === 0}>
  //           Сохранить
  //         </Button>
  //         <Button variant="secondary" onClick={() => navigate(`/hotels/${hotelId}/rooms`)}>
  //           Отменить
  //         </Button>
  //       </div>
  //     </Form>

  //     <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
  //       <Modal.Body>
  //         {modalImage && <img src={modalImage} alt="full" style={{ width: '100%' }} />}
  //       </Modal.Body>
  //     </Modal>
  //   </Container>
  // );
};

export default EditHotelRoomPage;
