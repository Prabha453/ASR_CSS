const SuperDao = require('../SuperDao');

class TemplateCategoryDao extends SuperDao {

    constructor() {
        super('template_category');
    }

    async findBySlug(tc_slug) {

        return this.Model.findOne({
            where: {
                tc_slug,
                is_deleted: false,
            },
        });

    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = TemplateCategoryDao;