const SuperDao = require('../SuperDao');

class OfficialMasterDao extends SuperDao {

    constructor() {
        super('official_master');
    }

    async findBySlug(official_master_slug) {

        return this.Model.findOne({
            where: {
                official_master_slug,
                is_deleted: false,
            },
        });

    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = OfficialMasterDao;