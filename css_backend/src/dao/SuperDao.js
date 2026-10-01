const logger = require('../config/logger');
const { getCurrentModels } = require('../models');

class SuperDao {
    constructor(model) {
        this._modelName = model;
    }

    get Model() {
        return getCurrentModels()[this._modelName];
    }

    // ================= FIND ALL =================
    async findAll(order = [['created_date', 'DESC']]) {
        try {
            return await this.Model.findAll({
                order,
            });
        } catch (e) {
            logger.error(e);
            console.log(e);
            return [];
        }
    }

    // ================= FIND BY ID =================
    async findById(id, primaryKey = null) {
        try {

            const pk = primaryKey || this.Model.primaryKeyAttribute;

            return await this.Model.findOne({
                where: {
                    [pk]: id,
                },
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return null;
        }
    }

    // ================= FIND ONE =================
    async findOneByWhere(
        where,
        attributes = null,
        order = null,
    ) {
        try {

            const primaryKey = this.Model.primaryKeyAttribute;

            const options = {
                where,
            };

            if (attributes) {
                options.attributes = attributes;
            }

            if (order) {
                options.order = [order];
            } else {
                options.order = [[primaryKey, 'DESC']];
            }

            return await this.Model.findOne(options);

        } catch (e) {
            logger.error(e);
            console.log(e);
            return null;
        }
    }

    // ================= FIND MANY =================
    async findByWhere(
        where,
        attributes = null,
        order = null,
        limit = null,
        offset = null,
    ) {
        try {

            const primaryKey = this.Model.primaryKeyAttribute;

            const options = {
                where,
            };

            if (attributes) {
                options.attributes = attributes;
            }

            if (order) {
                options.order = [order];
            } else {
                options.order = [[primaryKey, 'DESC']];
            }

            if (limit !== null) {
                options.limit = parseInt(limit, 10);
            }

            if (offset !== null) {
                options.offset = parseInt(offset, 10);
            }

            return await this.Model.findAll(options);

        } catch (e) {
            logger.error(e);
            console.log(e);
            return [];
        }
    }

    // ================= CREATE =================
    async create(data) {
        try {

            const result = await this.Model.create(data);

            return result;

        } catch (e) {
            logger.error(e);
            console.log(e);
            return null;
        }
    }

    // ================= UPDATE WHERE =================
    async updateWhere(data, where) {
        try {

            return await this.Model.update(data, {
                where,
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= UPDATE BY ID =================
    async updateById(data, id, primaryKey = null) {
        try {

            const pk = primaryKey || this.Model.primaryKeyAttribute;

            return await this.Model.update(data, {
                where: {
                    [pk]: id,
                },
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= DELETE =================
    async deleteByWhere(where) {
        try {

            return await this.Model.destroy({
                where,
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= BULK CREATE =================
    async bulkCreate(data) {
        try {

            return await this.Model.bulkCreate(data);

        } catch (e) {
            logger.error(e);
            console.log(e);
            return [];
        }
    }

    // ================= COUNT =================
    async getCountByWhere(where) {
        try {

            return await this.Model.count({
                where,
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return 0;
        }
    }

    // ================= INCREMENT =================
    async incrementCountInFieldByWhere(
        fieldName,
        where,
        incrementValue = 1
    ) {
        try {

            const instance = await this.Model.findOne({
                where,
            });

            if (!instance) {
                return false;
            }

            return await instance.increment(fieldName, {
                by: incrementValue,
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= DECREMENT =================
    async decrementCountInFieldByWhere(
        fieldName,
        where,
        decrementValue = 1
    ) {
        try {

            const instance = await this.Model.findOne({
                where,
            });

            if (!instance) {
                return false;
            }

            return await instance.decrement(fieldName, {
                by: decrementValue,
            });

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= UPDATE OR CREATE =================
    async updateOrCreate(values, condition) {
        try {

            const found = await this.Model.findOne({
                where: condition,
            });

            if (found) {
                return await found.update(values);
            }

            return await this.Model.create(values);

        } catch (e) {
            logger.error(e);
            console.log(e);
            return null;
        }
    }

    // ================= CHECK EXIST =================
    async checkExist(condition) {
        try {

            const count = await this.Model.count({
                where: condition,
            });

            return count > 0;

        } catch (e) {
            logger.error(e);
            console.log(e);
            return false;
        }
    }

    // ================= DATATABLE =================
    async getDataTableData(
        where,
        limit,
        offset,
        order = null,
    ) {
        try {

            const primaryKey = this.Model.primaryKeyAttribute;

            return await this.Model.findAndCountAll({
                where,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                order: order || [[primaryKey, 'DESC']],
            });

        } catch (e) {
            logger.error(e);
            console.log(e);

            return {
                rows: [],
                count: 0,
            };
        }
    }
}

module.exports = SuperDao;