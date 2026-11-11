const crypto = require('crypto');

jest.mock('../src/utils/mailer', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../src/models/userModel', () => ({
  findOne: jest.fn(),
}));

const User = require('../src/models/userModel');
const { sendPasswordResetEmail } = require('../src/utils/mailer');
const { forgotPassword, resetPassword, loginUser } = require('../src/controllers/userController');

const GENERIC_MESSAGE =
  'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

const asQuery = (value) => ({
  select() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CLIENT_URL = 'http://localhost:5173';
});

describe('forgotPassword', () => {
  test('rejects an invalid email before looking up users', async () => {
    const res = makeResponse();

    await forgotPassword({ body: { email: 'not-an-email' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('returns the same message when the email is missing and does not send mail', async () => {
    User.findOne.mockReturnValue(asQuery(null));
    const res = makeResponse();

    await forgotPassword({ body: { email: 'missing@shop.com' } }, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: GENERIC_MESSAGE });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('reset');
  });

  test('stores a hashed 15-minute token and emails the raw token once', async () => {
    const user = {
      name: 'Khách',
      email: 'customer@shop.com',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue(asQuery(user));
    sendPasswordResetEmail.mockResolvedValue({ messageId: 'mock' });
    const res = makeResponse();

    await forgotPassword({ body: { email: ' Customer@Shop.com ' } }, res);

    expect(res.json).toHaveBeenCalledWith({ message: GENERIC_MESSAGE });
    expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
    expect(user.passwordResetExpires.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000 + 1000);

    const { resetUrl } = sendPasswordResetEmail.mock.calls[0][0];
    const rawToken = resetUrl.split('/').pop();
    expect(resetUrl.startsWith('http://localhost:5173/reset-password/')).toBe(true);
    expect(hashToken(rawToken)).toBe(user.passwordResetToken);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(rawToken);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test('keeps the public response when email delivery fails and clears the token', async () => {
    const user = {
      name: 'Khách',
      email: 'customer@shop.com',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue(asQuery(user));
    sendPasswordResetEmail.mockRejectedValue(new Error('smtp down'));
    const res = makeResponse();

    await forgotPassword({ body: { email: 'customer@shop.com' } }, res);

    expect(res.json).toHaveBeenCalledWith({ message: GENERIC_MESSAGE });
    expect(user.passwordResetToken).toBeUndefined();
    expect(user.passwordResetExpires).toBeUndefined();
    expect(user.save).toHaveBeenCalledTimes(2);
  });
});

describe('resetPassword', () => {
  const rawToken = 'a'.repeat(64);

  test('rejects a short password without consuming the token', async () => {
    const res = makeResponse();

    await resetPassword({ params: { token: rawToken }, body: { password: '123' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('rejects an expired or unknown token', async () => {
    User.findOne.mockReturnValue(asQuery(null));
    const res = makeResponse();

    await resetPassword({ params: { token: rawToken }, body: { password: 'newpassword123' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findOne).toHaveBeenCalledWith({
      passwordResetToken: hashToken(rawToken),
      passwordResetExpires: { $gt: expect.any(Date) },
    });
  });

  test('sets the new password, clears the token, and refuses a second use', async () => {
    const user = {
      email: 'customer@shop.com',
      password: 'old-hash',
      passwordResetToken: hashToken(rawToken),
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      save: jest.fn().mockImplementation(async function save() {
        return this;
      }),
    };
    User.findOne.mockImplementation((query) => {
      const stillValid =
        user.passwordResetToken &&
        query.passwordResetToken === user.passwordResetToken &&
        user.passwordResetExpires > query.passwordResetExpires.$gt;
      return asQuery(stillValid ? user : null);
    });

    const first = makeResponse();
    await resetPassword({ params: { token: rawToken }, body: { password: 'newpassword123' } }, first);

    expect(first.json).toHaveBeenCalledWith({
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
    expect(user.password).toBe('newpassword123');
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
    expect(user.passwordResetToken).toBeUndefined();
    expect(user.passwordResetExpires).toBeUndefined();

    const second = makeResponse();
    await resetPassword({ params: { token: rawToken }, body: { password: 'anotherpass123' } }, second);
    expect(second.status).toHaveBeenCalledWith(400);
  });
});

describe('login still rejects a wrong password', () => {
  test('returns 401 for a known user with the wrong password', async () => {
    User.findOne.mockReturnValue(asQuery({
      matchPassword: jest.fn().mockResolvedValue(false),
    }));
    const res = makeResponse();

    await loginUser({ body: { email: 'customer@shop.com', password: 'wrong-password' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
