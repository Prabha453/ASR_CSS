const SuperDao = require('../SuperDao');

class MemberIdTypeDao extends SuperDao {

    constructor() {
        super('member_id_type');
    }

    async findBySlug(slug_name) {
        return this.Model.findOne({
            where: {
                slug_name,
                is_deleted: false,
            },
        });
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);
    
    destroyWhere = (where)=>this.Model.destroy({where});

}

module.exports = MemberIdTypeDao;