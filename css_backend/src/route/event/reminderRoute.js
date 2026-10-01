const express = require('express');
const ReminderController = require('../../controllers/company/ReminderController');
const ReminderValidator = require('../../validator/company/ReminderValidator');
const auth = require('../../middlewares/auth');
const { handleAnyUpload } = require('../../middlewares/uploadDocument');

const router = express.Router();
const controller = new ReminderController();
const validator = new ReminderValidator();

const uploadReminderFiles = async (req, res, next) => {
    try {
        await handleAnyUpload(req, res);
        next();
    } catch (err) {
        next(err);
    }
};

router.get('/list', auth(), controller.list);
router.get('/get/:reminder_id', auth(), controller.get);
router.post('/create', auth(), uploadReminderFiles, validator.save, controller.create);
router.put('/update/:reminder_id', auth(), uploadReminderFiles, validator.save, controller.update);
router.delete('/delete/:reminder_id', auth(), controller.delete);
router.get('/logs', auth(), controller.logs);

module.exports = router;
