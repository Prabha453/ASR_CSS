'use strict';

const table = require('../../helper/dbTable');

const DEFAULT_COLORS = {
  // Company Level (t_type: 1)
  'Pre-Allotment':           '#405189',
  'Allotment':               '#0ab39c',
  'Transfer':                '#3498db',
  'Dissolved':               '#e74c3c',
  'Cancel':                  '#95a5a6',
  'Replace of Lost Share Cert': '#e67e22',
  'Split Share Cert':        '#9b59b6',
  'Combine Shares':          '#16a085',
  // Shareholder Level (t_type: 2)
  'Share Increase':          '#30a16c',
  'Share Decrease':          '#e74c3c',
  'Authorized Increase':     '#3498db',
  'Capital Reduction':       '#f39c12',
  'Conversion':              '#9b59b6',
  'Consolidation':           '#1abc9c',
  'Subdivide':               '#e67e22',
  'Buyback':                 '#34495e',
  'Reduction':               '#c0392b',
  'Redeemtion':              '#2980b9',
};

module.exports = {

  up: async (queryInterface, Sequelize) => {

    const transactionTypes = [
      { t_id: 1,  t_type: '1', t_name: 'Pre-Allotment',            t_order: 1  },
      { t_id: 2,  t_type: '1', t_name: 'Allotment',                t_order: 2  },
      { t_id: 3,  t_type: '1', t_name: 'Transfer',                 t_order: 3  },
      { t_id: 4,  t_type: '1', t_name: 'Dissolved',                t_order: 4  },
      { t_id: 5,  t_type: '1', t_name: 'Cancel',                   t_order: 5  },
      { t_id: 6,  t_type: '1', t_name: 'Replace of Lost Share Cert', t_order: 6 },
      { t_id: 7,  t_type: '1', t_name: 'Split Share Cert',         t_order: 7  },
      { t_id: 8,  t_type: '1', t_name: 'Combine Shares',           t_order: 8  },
      { t_id: 9,  t_type: '2', t_name: 'Share Increase',           t_order: 9  },
      { t_id: 10, t_type: '2', t_name: 'Share Decrease',           t_order: 10 },
      { t_id: 11, t_type: '2', t_name: 'Authorized Increase',      t_order: 11 },
      { t_id: 12, t_type: '2', t_name: 'Capital Reduction',        t_order: 12 },
      { t_id: 13, t_type: '2', t_name: 'Conversion',               t_order: 13 },
      { t_id: 14, t_type: '2', t_name: 'Consolidation',            t_order: 14 },
      { t_id: 15, t_type: '2', t_name: 'Subdivide',                t_order: 15 },
      { t_id: 16, t_type: '2', t_name: 'Buyback',                  t_order: 16 },
      { t_id: 17, t_type: '2', t_name: 'Reduction',                t_order: 17 },
      { t_id: 18, t_type: '2', t_name: 'Redeemtion',               t_order: 18 },
    ];

    return queryInterface.bulkInsert(
      table('transaction_type'),
      transactionTypes.map((item) => ({
        t_id:           item.t_id,
        t_type:         item.t_type,
        t_name:         item.t_name,
        t_order:        item.t_order,
        t_type_no: null,
        t_type_color:          DEFAULT_COLORS[item.t_name] || '#30a16c',
        is_deleted:     0,
        updated_date:   '2026-05-25 14:31:00',
        updated_by:     1,
      })),
      { ignoreDuplicates: true }
    );
  },

  down: async (queryInterface, Sequelize) => {

    return queryInterface.bulkDelete(
      table('transaction_type'),
      {
        t_type: ['1', '2'],
        t_name: [
          'Pre-Allotment',
          'Allotment',
          'Transfer',
          'Dissolved',
          'Cancel',
          'Replace of Lost Share Cert',
          'Split Share Cert',
          'Combine Shares',
          'Share Increase',
          'Share Decrease',
          'Authorized Increase',
          'Capital Reduction',
          'Buyback',
          'Consolidation',
          'Subdivide',
          'Conversion',
          'Reduction',
          'Redeemtion',
        ],
      },
      {}
    );
  },

};