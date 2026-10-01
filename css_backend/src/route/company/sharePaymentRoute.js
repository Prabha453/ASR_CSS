const express    = require('express');
const auth       = require('../../middlewares/auth');
const controller = require('../../controllers/company/SharePaymentController');

const router = express.Router();
const ctrl   = new controller();

router.get('/:txn_id/list',          auth(), ctrl.list);
router.post('/create',               auth(), ctrl.create);
router.put('/update/:id',            auth(), ctrl.update);
router.post('/:txn_id/instalment',   auth(), ctrl.updateInstalment);
router.post('/delete',               auth(), ctrl.delete);

module.exports = router;
