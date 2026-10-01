import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Badge, Modal, ModalHeader, ModalBody } from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const EVENT_TYPES = {
  AGM: { color: '#e34948', label: 'AGM' },
  AR:  { color: '#2a78d6', label: 'AR' },
  CEI: { color: '#1baf7a', label: 'CEI' },
  CR:  { color: '#eb6834', label: 'Change Request' },
  EGM: { color: '#4a3aa7', label: 'EGM' },
  BM:  { color: '#e87ba4', label: 'Board Meeting' },
};

const EVENT_TEXT_COLOR = '#0f2044';

const hexToRgba = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EVENTS = [
  // AGM
  { id: '1',  title: 'AGM – NATURE CARE PTE LTD',          start: '2026-06-15', type: 'AGM' },
  { id: '2',  title: 'AGM – XYZ PTE LTD',                  start: '2026-06-22', type: 'AGM' },
  { id: '3',  title: 'AGM – BIZSAFE INTL PTE LTD',         start: '2026-06-28', type: 'AGM' },
  { id: '4',  title: 'AGM – WELCOME ABOARD PTE LTD',       start: '2026-07-04', type: 'AGM' },
  { id: '5',  title: 'AGM – ALPHA SHINE LTD 2',            start: '2026-07-21', type: 'AGM' },
  { id: '6',  title: 'AGM – TEAMWORK APAC PTE LTD',        start: '2026-07-14', type: 'AGM' },
  // AR
  { id: '7',  title: 'AR – NATURE CARE PTE LTD',           start: '2026-06-18', type: 'AR' },
  { id: '8',  title: 'AR – GLOBAL TRADE PTE LTD',          start: '2026-06-25', type: 'AR' },
  { id: '9',  title: 'AR – PACIFIC VENTURES PTE LTD',      start: '2026-07-10', type: 'AR' },
  { id: '10', title: 'AR – BELLUS CRAFT PTE LTD',          start: '2026-07-28', type: 'AR' },
  // CEI
  { id: '11', title: 'CEI – BELLUS CRAFT PTE LTD',         start: '2026-06-20', type: 'CEI' },
  { id: '12', title: 'CEI – THIRU HIGHLAND PTE LTD',       start: '2026-07-05', type: 'CEI' },
  { id: '13', title: 'CEI – NSCARE PTE LTD',               start: '2026-07-19', type: 'CEI' },
  // Change Request Expiry
  { id: '14', title: 'CR Expiry – THIRU HIGHLAND PTE LTD', start: '2026-07-14', type: 'CR' },
  { id: '15', title: 'CR Expiry – TeamWork APAC Pte Ltd',  start: '2026-07-14', type: 'CR' },
  { id: '16', title: 'CR Expiry – Alpha_Shine_ LTD 2',     start: '2026-07-21', type: 'CR' },
  { id: '17', title: 'CR Expiry – Testing Teamwork APAC',  start: '2026-07-25', type: 'CR' },
  // EGM
  { id: '18', title: 'EGM – GLOBAL TRADE PTE LTD',         start: '2026-06-30', type: 'EGM' },
  { id: '19', title: 'EGM – LUXE LUXE PTE LTD',            start: '2026-07-16', type: 'EGM' },
  // Board Meeting
  { id: '20', title: 'Board Meeting – PACIFIC VENTURES',   start: '2026-07-08', type: 'BM' },
  { id: '21', title: 'Board Meeting – XYZ PTE LTD',        start: '2026-06-17', type: 'BM' },
];

const calendarEvents = EVENTS.map((e) => ({
  id: e.id,
  title: e.title,
  start: e.start,
  backgroundColor: hexToRgba(EVENT_TYPES[e.type].color, 0.14),
  borderColor: hexToRgba(EVENT_TYPES[e.type].color, 0.4),
  textColor: EVENT_TEXT_COLOR,
  extendedProps: { type: e.type },
}));

const EventCalendarWidget = ({ dragHandleProps }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventClick = ({ event }) => {
    setSelectedEvent({
      title: event.title,
      date: event.startStr,
      type: event.extendedProps.type,
      color: EVENT_TYPES[event.extendedProps.type]?.color,
      typeLabel: EVENT_TYPES[event.extendedProps.type]?.label,
    });
  };

  return (
    <Card className="mb-3 shadow-sm">
      <CardHeader
        className="d-flex align-items-center py-2 px-3"
        style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}
      >
        <div
          {...dragHandleProps}
          className="me-2 text-muted"
          style={{ cursor: 'grab', lineHeight: 1 }}
          title="Drag to reorder"
        >
          <i className="ri-drag-move-2-line fs-5" />
        </div>
        <i className="ri-calendar-event-line me-2 text-primary fs-5" />
        <h6 className="mb-0 fw-semibold flex-grow-1 fs-13">Corporate Events Calendar</h6>
        <div className="d-flex flex-wrap gap-2">
          {Object.entries(EVENT_TYPES).map(([key, val]) => (
            <span key={key} className="d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 10, height: 10, background: val.color, flexShrink: 0 }}
              />
              {val.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardBody className="p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek',
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          height={420}
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </CardBody>

      <Modal isOpen={!!selectedEvent} toggle={() => setSelectedEvent(null)} centered size="sm">
        <ModalHeader toggle={() => setSelectedEvent(null)}>
          Event Details
        </ModalHeader>
        <ModalBody>
          {selectedEvent && (
            <div>
              <div className="mb-2">
                <Badge style={{ background: selectedEvent.color }} className="mb-2">
                  {selectedEvent.typeLabel}
                </Badge>
              </div>
              <p className="mb-1 fw-semibold">{selectedEvent.title}</p>
              <p className="mb-0 text-muted fs-13">
                <i className="ri-calendar-line me-1" />
                {selectedEvent.date}
              </p>
            </div>
          )}
        </ModalBody>
      </Modal>
    </Card>
  );
};

export default EventCalendarWidget;
