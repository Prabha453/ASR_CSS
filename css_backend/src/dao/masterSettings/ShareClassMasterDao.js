const SuperDao = require('../SuperDao');

class ShareClassMasterDao extends SuperDao {

    constructor() {
        super('share_class_master');
    }

    async findBySlug(sc_slug) {
        return this.Model.findOne({
            where: {
                sc_slug,
                is_deleted: false,
            },
        });
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = ShareClassMasterDao;