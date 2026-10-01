const SuperDao = require('./SuperDao');

class TokenDao extends SuperDao {
    constructor() {
        super('token'); // ✅ SuperDao getter handles the rest
    }

    async findOne(where) {
        return this.Model.findOne({ where });
    }

    async remove(where) {
        return this.Model.destroy({ where });
    }
}

module.exports = TokenDao;