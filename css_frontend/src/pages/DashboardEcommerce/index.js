import React, { useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Section from './Section';
import CompanyStatsCards from './CompanyStatsCards';
import DashboardCharts from './DashboardCharts';
import DueAlertCard from './DueAlertCard';
import EventCalendarWidget from './EventCalendarWidget';
import RecentActivity from './RecentActivity';

const SECTIONS_DATA = {
  'agm-alert': {
    title: 'AGM Due Alert',
    count: 223,
    accentColor: '#e74c3c',
    items: [
      { company: 'FYE DATE NOT ENTERED -576',    dateLabel: 'AGM Due Date', date: '03/12/2000', status: 'danger' },
      { company: 'XYZ',                          dateLabel: 'AGM Due Date', date: '10/01/2001', status: 'danger' },
      { company: 'NATURE CARE PTE LTD',          dateLabel: 'AGM Due Date', date: '26/06/2001', status: 'danger' },
      { company: 'AR DUE DATE',                  dateLabel: 'AGM Due Date', date: '02/10/2001', status: 'danger' },
      { company: 'BIZSAFE INTL PTE LTD',         dateLabel: 'AGM Due Date', date: '15/03/2026', status: 'warning' },
      { company: 'WELCOME ABOARD PTE LTD',       dateLabel: 'AGM Due Date', date: '28/07/2026', status: 'warning' },
      { company: 'ALPHA SHINE LTD 2',            dateLabel: 'AGM Due Date', date: '21/07/2026', status: 'warning' },
      { company: 'TEAMWORK APAC PTE LTD',        dateLabel: 'AGM Due Date', date: '14/07/2026', status: 'warning' },
    ],
  },
  'ar-alert': {
    title: 'AR Due Alert',
    count: 222,
    accentColor: '#2980b9',
    items: [
      { company: 'FYE DATE NOT ENTERED -576',    dateLabel: 'AR Due Date', date: '03/01/2001', status: 'danger' },
      { company: 'XYZ',                          dateLabel: 'AR Due Date', date: '10/02/2001', status: 'danger' },
      { company: 'NATURE CARE PTE LTD',          dateLabel: 'AR Due Date', date: '26/07/2001', status: 'danger' },
      { company: 'AR DUE DATE',                  dateLabel: 'AR Due Date', date: '02/11/2001', status: 'danger' },
      { company: 'GLOBAL TRADE PTE LTD',         dateLabel: 'AR Due Date', date: '15/06/2026', status: 'warning' },
      { company: 'PACIFIC VENTURES PTE LTD',     dateLabel: 'AR Due Date', date: '30/07/2026', status: 'warning' },
      { company: 'BELLUS CRAFT PTE LTD',         dateLabel: 'AR Due Date', date: '22/08/2026', status: 'warning' },
    ],
  },
  'cei-alert': {
    title: 'CEI Due Alert',
    count: 48,
    accentColor: '#27ae60',
    items: [
      { company: 'BELLUS CRAFT PTE LTD',         dateLabel: 'CEI Due Date', date: '20/06/2026', status: 'warning' },
      { company: 'THIRU HIGHLAND PTE LTD',       dateLabel: 'CEI Due Date', date: '05/07/2026', status: 'warning' },
      { company: 'NSCARE PTE LTD',               dateLabel: 'CEI Due Date', date: '19/07/2026', status: 'warning' },
      { company: 'LUXE LUXE',                    dateLabel: 'CEI Due Date', date: '30/08/2026', status: 'warning' },
    ],
  },
  'change-request': {
    title: 'Change Request Expiry Reminder',
    count: 17,
    accentColor: '#f39c12',
    items: [
      { company: 'THIRU HIGHLAND PTE LTD',           dateLabel: 'Expiry Date', date: '14/07/2026', status: 'warning' },
      { company: 'TeamWork APAC Pte Ltd',             dateLabel: 'Expiry Date', date: '14/07/2026', status: 'warning' },
      { company: 'Alpha_Shine_ LTD 2',               dateLabel: 'Expiry Date', date: '21/07/2026', status: 'warning' },
      { company: 'Testing Teamwork APAC PTE LTD',    dateLabel: 'Expiry Date', date: '25/07/2026', status: 'warning' },
    ],
  },
  'no-default-recipients': {
    title: 'No Default Reminder Recipients',
    count: 19,
    accentColor: '#8e44ad',
    items: [
      { company: 'XYZ PTE LTD2',                    dateLabel: 'Start Date', date: '28/12/2018', status: 'secondary' },
      { company: 'BELLUS CRAFT PTE LTD',             dateLabel: 'Start Date', date: '07/06/2021', status: 'secondary' },
      { company: 'BIZSAFE INTERNATIONAL PTE. LTD',   dateLabel: 'Start Date', date: '26/08/2021', status: 'secondary' },
      { company: 'WELCOME ABOARD PTE LTD',           dateLabel: 'Start Date', date: '14/09/2021', status: 'secondary' },
    ],
  },
  'no-recipients': {
    title: 'No Reminder Recipients',
    count: 678,
    accentColor: '#8e44ad',
    items: [
      { company: 'THE LUXE',              dateLabel: 'Start Date', date: '19/06/2018', status: 'secondary' },
      { company: 'LUXE LUXE',             dateLabel: 'Start Date', date: '19/06/2018', status: 'secondary' },
      { company: 'NIVEDHA123456',         dateLabel: 'Start Date', date: '19/06/2018', status: 'secondary' },
      { company: 'NSCARE',                dateLabel: 'Start Date', date: '13/07/2018', status: 'secondary' },
      { company: 'SENTHIL TRADERS PTE LTD', dateLabel: 'Start Date', date: '20/08/2018', status: 'secondary' },
    ],
  },
  'incorporation-missing': {
    title: 'Incorporation Date Not Entered',
    count: 5,
    accentColor: '#c0392b',
    items: [
      { company: 'SENTHIL PAPER STORE 2', dateLabel: '', date: '', status: 'primary' },
      { company: 'DF23424',               dateLabel: '', date: '', status: 'primary' },
      { company: 'COMP_ADD',              dateLabel: '', date: '', status: 'primary' },
      { company: 'CR_COM',                dateLabel: '', date: '', status: 'primary' },
      { company: 'TEST_INCORP_NULL',      dateLabel: '', date: '', status: 'primary' },
    ],
  },
  'no-status': {
    title: 'No Status for Reminder',
    count: 686,
    accentColor: '#7f8c8d',
    items: [
      { company: 'ALPHA CORP PTE LTD',       dateLabel: 'Start Date', date: '05/01/2019', status: 'secondary' },
      { company: 'BETA SYSTEMS PTE LTD',     dateLabel: 'Start Date', date: '12/03/2019', status: 'secondary' },
      { company: 'GAMMA SOLUTIONS LTD',      dateLabel: 'Start Date', date: '18/05/2019', status: 'secondary' },
      { company: 'DELTA TRADING PTE LTD',    dateLabel: 'Start Date', date: '22/07/2019', status: 'secondary' },
      { company: 'EPSILON VENTURES PTE LTD', dateLabel: 'Start Date', date: '30/09/2019', status: 'secondary' },
    ],
  },
};

const reorder = (list, from, to) => {
  const result = Array.from(list);
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
};

const moveBetween = (src, dst, si, di) => {
  const s = Array.from(src);
  const d = Array.from(dst);
  const [item] = s.splice(si, 1);
  d.splice(di, 0, item);
  return { s, d };
};

const DashboardEcommerce = () => {
  document.title = 'Dashboard | Corporate Secretarial System';

  const [rightColumn, setRightColumn] = useState(false);
  const toggleRightColumn = () => setRightColumn((v) => !v);

  const [topZone,    setTopZone]    = useState(['charts-section']);
  const [col1,       setCol1]       = useState(['agm-alert',  'change-request',        'incorporation-missing']);
  const [col2,       setCol2]       = useState(['ar-alert',   'no-default-recipients', 'no-status']);
  const [col3,       setCol3]       = useState(['cei-alert',  'no-recipients']);
  const [bottomZone, setBottomZone] = useState(['event-calendar']);

  const getList = (id) => {
    if (id === 'top')    return topZone;
    if (id === 'col1')   return col1;
    if (id === 'col2')   return col2;
    if (id === 'col3')   return col3;
    return bottomZone;
  };
  const setList = (id, list) => {
    if (id === 'top')    setTopZone(list);
    else if (id === 'col1')   setCol1(list);
    else if (id === 'col2')   setCol2(list);
    else if (id === 'col3')   setCol3(list);
    else setBottomZone(list);
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === destination.droppableId) {
      setList(source.droppableId, reorder(getList(source.droppableId), source.index, destination.index));
    } else {
      const { s, d } = moveBetween(
        getList(source.droppableId),
        getList(destination.droppableId),
        source.index,
        destination.index,
      );
      setList(source.droppableId, s);
      setList(destination.droppableId, d);
    }
  };

  const renderSection = (id, provided) => {
    if (id === 'charts-section') {
      return <DashboardCharts dragHandleProps={provided.dragHandleProps} />;
    }
    if (id === 'event-calendar') {
      return <EventCalendarWidget dragHandleProps={provided.dragHandleProps} />;
    }
    const data = SECTIONS_DATA[id];
    if (!data) return null;
    return (
      <DueAlertCard
        title={data.title}
        count={data.count}
        items={data.items}
        accentColor={data.accentColor}
        dragHandleProps={provided.dragHandleProps}
      />
    );
  };

  const renderColumn = (colId, ids) => (
    <Droppable droppableId={colId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            minHeight: 80,
            borderRadius: 8,
            padding: snapshot.isDraggingOver ? 4 : 0,
            background: snapshot.isDraggingOver ? 'rgba(41,128,185,0.05)' : 'transparent',
            transition: 'background 0.2s',
          }}
        >
          {ids.map((id, index) => (
            <Draggable key={id} draggableId={id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  style={{
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.88 : 1,
                    boxShadow: snapshot.isDragging ? '0 12px 32px rgba(0,0,0,0.18)' : 'none',
                    borderRadius: 10,
                  }}
                >
                  {renderSection(id, provided)}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col>
              <Section rightClickBtn={toggleRightColumn} />
              <CompanyStatsCards />
              <DragDropContext onDragEnd={onDragEnd}>
                {/* Charts — full width at top */}
                <Row className="mb-3">
                  <Col xl={12}>{renderColumn('top', topZone)}</Col>
                </Row>

                {/* Due Alerts — 3 equal columns */}
                <Row className="g-3 mb-3">
                  <Col xl={4}>{renderColumn('col1', col1)}</Col>
                  <Col xl={4}>{renderColumn('col2', col2)}</Col>
                  <Col xl={4}>{renderColumn('col3', col3)}</Col>
                </Row>

                {/* Calendar — full width at bottom */}
                <Row>
                  <Col xl={12}>{renderColumn('bottom', bottomZone)}</Col>
                </Row>
              </DragDropContext>
            </Col>
            <RecentActivity
              rightColumn={rightColumn}
              hideRightColumn={toggleRightColumn}
            />
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;
