const SuperDao = require('./SuperDao');   

class UserDao extends SuperDao {
    constructor() {
        super('user'); // ✅
    }   

    async findByEmail(email) {
        return this.Model.findOne({ where: { email } });
    }

    async isEmailExists(email) {
        return this.Model.count({ where: { email } }).then((count) => {
            if (count != 0) return true;
            return false;
        });
    }

    async createWithTransaction(user, transaction) {
        return this.Model.create(user, { transaction });
    }

    findAndCountAll = (options)=>this.Model.findAndCountAll(options);

    destroyWhere = (where)=>this.Model.destroy({where});
    
}

module.exports = UserDao;