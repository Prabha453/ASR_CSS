'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    up: async (queryInterface, Sequelize) => {

        const fees = [
            {
                fee_id: 1,
                type_of_fee: 'Incorporation Fee',
                currency: 'SGD',
                low_range: null,
                high_range: null,
                fee_amt: 300.00,
                plus_minus: 1,
                category_id: 1,
                description: 'One-time company incorporation fee',
                detailed_description: 'Government filing and setup processing fee.',
            },
            {
                fee_id: 2,
                type_of_fee: 'Annual Filing Fee',
                currency: 'SGD',
                low_range: null,
                high_range: null,
                fee_amt: 180.00,
                plus_minus: 1,
                category_id: 2,
                description: 'Annual return filing service fee',
                detailed_description: 'Preparation and filing of yearly statutory return.',
            },
            {
                fee_id: 3,
                type_of_fee: 'Bookkeeping Fee',
                currency: 'SGD',
                low_range: 0.00,
                high_range: 50000.00,
                fee_amt: 120.00,
                plus_minus: 1,
                category_id: 3,
                description: 'Monthly bookkeeping fee (basic tier)',
                detailed_description: 'Covers up to SGD 50,000 annual turnover.',
            },
            {
                fee_id: 4,
                type_of_fee: 'Tax Filing Fee',
                currency: 'SGD',
                low_range: null,
                high_range: null,
                fee_amt: 250.00,
                plus_minus: 1,
                category_id: 4,
                description: 'Corporate income tax filing fee',
                detailed_description: 'Includes tax computation and filing support.',
            },
            {
                fee_id: 5,
                type_of_fee: 'Loyalty Discount',
                currency: 'SGD',
                low_range: null,
                high_range: null,
                fee_amt: 50.00,
                plus_minus: -1, 
                category_id: 5,
                description: 'Discount for long-term clients',
                detailed_description: 'Applied as a deduction to total service invoice.',
            },
        ];

        return queryInterface.bulkInsert(
            table('type_of_fee'),
            fees.map((item) => ({
                fee_id: item.fee_id,
                type_of_fee: item.type_of_fee,
                currency: item.currency,
                low_range: item.low_range,
                high_range: item.high_range,
                fee_amt: item.fee_amt,
                plus_minus: item.plus_minus,
                category_id: item.category_id,
                description: item.description,
                detailed_description: item.detailed_description,
                is_deleted: 0,
                updated_date: '2026-05-25 14:32:00',
                updated_by: 1,
            })),
            {
                ignoreDuplicates: true,
            }
        );

    },

    down: async (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete(
            table('type_of_fee'),
            {
                type_of_fee: [
                    'Incorporation Fee',
                    'Annual Filing Fee',
                    'Bookkeeping Fee',
                    'Tax Filing Fee',
                    'Loyalty Discount',
                ],
            },
            {}
        );

    },

};
