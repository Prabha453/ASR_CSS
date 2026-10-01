const express    = require('express');
const auth       = require('../../middlewares/auth');
const controller = require('../../controllers/company/EntityShareController');

const router = express.Router();
const ctrl   = new controller();

router.get('/:entity_id/list',    auth(), ctrl.list);
router.get('/:entity_id/history', auth(), ctrl.history);
router.get('/get/:id',            auth(), ctrl.get);
router.post('/create',            auth(), ctrl.create);
router.put('/update/:id',         auth(), ctrl.update);
router.post('/delete',            auth(), ctrl.delete);

module.exports = router;
