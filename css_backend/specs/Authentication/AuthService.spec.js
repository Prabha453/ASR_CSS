'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');

const AuthService = require('../../src/service/AuthService');
const logHelper = require('../../src/helper/LogHelper');

const loginData = { email: 'john@mail.com', password: '123123Asd' };

const buildUser = (password = loginData.password) => {
    const data = {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: loginData.email,
        uuid: '4d85f12b-6e5b-468b-a971-eabe8acc9d08',
        user_status: 'ACTIVE',
        user_password: bcrypt.hashSync(password, 8),
        email_verified: 1,
        user_group_id: null,
    };

    return { ...data, toJSON: () => ({ ...data }) };
};

describe('User Login test', () => {
    let authService;

    beforeEach(() => {
        authService = new AuthService();
        sinon.stub(authService.userPermissionDao, 'findOneByWhere').resolves(null);
        sinon.stub(authService, '_getCompanyProfileForLogin').resolves({});
        sinon.stub(logHelper, 'writeLoginHistory').resolves();
    });

    afterEach(() => sinon.restore());

    it('logs in an active user with valid credentials', async () => {
        sinon.stub(authService.userDao, 'findOneByWhere').resolves(buildUser());

        const result = await authService.loginWithEmailPassword(loginData.email, loginData.password);

        expect(result.statusCode).to.equal(httpStatus.OK);
        expect(result.response.message).to.equal('Login successful');
        expect(result.response.data).to.include({
            user_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: loginData.email,
        });
        expect(result.response.data).not.to.have.property('user_password');
    });

    it('returns the generic credential error when the email is unknown', async () => {
        sinon.stub(authService.userDao, 'findOneByWhere').resolves(null);

        const result = await authService.loginWithEmailPassword('test@mail.com', '23232132');

        expect(result.statusCode).to.equal(httpStatus.BAD_REQUEST);
        expect(result.response.message).to.equal('Invalid email or password');
    });

    it('returns the generic credential error and logs a wrong password', async () => {
        sinon.stub(authService.userDao, 'findOneByWhere').resolves(buildUser('different-password'));

        const result = await authService.loginWithEmailPassword(loginData.email, loginData.password);

        expect(result.statusCode).to.equal(httpStatus.BAD_REQUEST);
        expect(result.response.message).to.equal('Invalid email or password');
        expect(logHelper.writeLoginHistory.calledOnce).to.equal(true);
        expect(logHelper.writeLoginHistory.firstCall.args[1]).to.deep.equal({
            user_id: 1,
            login_status: 'FAILED',
            failure_reason: 'WRONG_PASSWORD',
        });
    });
});
