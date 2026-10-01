const SuperDao = require('./SuperDao');

class ToDoTaskDao extends SuperDao {

    constructor() {
        super('todo_tasks');
    }

}

module.exports = ToDoTaskDao;
