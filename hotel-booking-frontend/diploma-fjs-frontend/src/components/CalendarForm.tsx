import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CalendarFormProps {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onDatesChange: (dates: { checkInDate: Date | null; checkOutDate: Date | null }) => void;
}

const CalendarForm: React.FC<CalendarFormProps> = ({ checkInDate, checkOutDate, onDatesChange }) => {
  return (
    <div className="mb-4">
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label mb-3 me-3">Заезд</label>
          <DatePicker
            selected={checkInDate}
            onChange={(date) => onDatesChange({ checkInDate: date, checkOutDate })}
            dateFormat="dd.MM.yyyy"
            className="form-control"
            placeholderText="Выберите дату заезда"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label mb-3 me-3">Выезд</label>
          <DatePicker
            selected={checkOutDate}
            onChange={(date) => onDatesChange({ checkInDate, checkOutDate: date })}
            dateFormat="dd.MM.yyyy"
            className="form-control"
            placeholderText="Выберите дату выезда"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarForm;