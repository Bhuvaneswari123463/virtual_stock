import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { TokenUtility } from '../src/utilities/tokens';
import { userRepository } from '../src/repositories/userRepository';
import { sessionRepository } from '../src/repositories/sessionRepository';

describe('Phase 4 Authentication & Account Management API', () => {
  const app = createApp();

  const testUser = {
    email: 'trader.alex@virtualtrade.in',
    password: 'Password@123',
    fullName: 'Alex Trader',
  };

  describe('User Registration & Portfolio Initialization', () => {
    it('registers user and initializes virtual portfolio with exactly ₹10,00,000', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('trader');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.portfolio.cashBalancePaise).toBe(100000000); // 1 Crore paise = 10 Lakhs INR
      expect(res.body.data.portfolio.cashBalanceFormatted).toContain('10,00,000');

      // Verifies HttpOnly refresh cookie is set
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('vt_refresh_token='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });

    it('handles concurrent registration safely without double-allocating capital', async () => {
      const concurrentEmail = 'concurrent.racer@virtualtrade.in';
      const registerPayload = {
        email: concurrentEmail,
        password: 'Password@123',
        fullName: 'Concurrent Racer',
      };

      // Send 5 concurrent registration requests simultaneously
      const results = await Promise.all([
        request(app).post('/api/v1/auth/register').send(registerPayload),
        request(app).post('/api/v1/auth/register').send(registerPayload),
        request(app).post('/api/v1/auth/register').send(registerPayload),
        request(app).post('/api/v1/auth/register').send(registerPayload),
        request(app).post('/api/v1/auth/register').send(registerPayload),
      ]);

      const successCount = results.filter((r) => r.status === 201).length;
      const conflictCount = results.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });

    it('validates password complexity (uppercase, lowercase, number, 8+ chars)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'weak.password@test.com',
        password: 'weak',
        fullName: 'Weak Password',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('User Login & Credentials Verification', () => {
    it('authenticates valid credentials and issues tokens and cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.portfolio.cashBalancePaise).toBe(100000000);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes('vt_refresh_token='))).toBe(true);
    });

    it('rejects incorrect password with 401 Unauthorized and safe message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects non-existent email with 401 and generic safe message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent.user@virtualtrade.in',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('Refresh Token Rotation, Revocation & Reuse Detection', () => {
    let activeRefreshToken: string;
    let authCookieHeader: string;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      authCookieHeader = cookies[0];
      activeRefreshToken = authCookieHeader.split(';')[0].replace('vt_refresh_token=', '');
    });

    it('rotates refresh token and returns new access token on POST /refresh', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`vt_refresh_token=${activeRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c: string) => c.includes('vt_refresh_token='))).toBe(true);
    });

    it('detects refresh token reuse and immediately invalidates session family', async () => {
      // 1. Perform legitimate rotation
      const rotateRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`vt_refresh_token=${activeRefreshToken}`]);

      expect(rotateRes.status).toBe(200);

      // 2. Attacker attempts to reuse the already-rotated old refresh token!
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`vt_refresh_token=${activeRefreshToken}`]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
      expect(reuseRes.body.error.message).toContain('reuse detected');
    });

    it('handles session revocation on logout', async () => {
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`vt_refresh_token=${activeRefreshToken}`]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Trying to refresh with logged-out token fails
      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`vt_refresh_token=${activeRefreshToken}`]);

      expect(refreshAfterLogout.status).toBe(401);
    });

    it('rejects expired refresh token sessions', async () => {
      // Create manually expired session
      const { token: expiredToken, hash: expiredHash } = TokenUtility.generateRefreshToken();
      const user = await userRepository.findByEmail(testUser.email);
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in the past

      await sessionRepository.create({
        userId: String(user._id || user.id),
        refreshTokenHash: expiredHash,
        family: TokenUtility.generateFamilyId(),
        expiresAt: expiredDate,
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`vt_refresh_token=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('expired');
    });
  });

  describe('Protected Routes & Role-Based Authorization', () => {
    let traderAccessToken: string;
    let adminAccessToken: string;

    beforeEach(async () => {
      // Login trader
      const traderRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      traderAccessToken = traderRes.body.data.accessToken;

      // Register or find admin user
      const adminEmail = 'superadmin@virtualtrade.in';
      let admin = await userRepository.findByEmail(adminEmail);
      if (!admin) {
        admin = await userRepository.create({
          email: adminEmail,
          passwordHash: 'hashed_admin_pass',
          fullName: 'Platform Admin',
          role: 'admin',
        });
      }

      adminAccessToken = TokenUtility.signAccessToken({
        userId: String(admin._id || admin.id),
        email: adminEmail,
        fullName: 'Platform Admin',
        role: 'admin',
      });
    });

    it('GET /api/v1/auth/me returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me returns 200 with user profile for valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${traderAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.portfolio).toBeDefined();
    });

    it('GET /api/v1/admin/metrics returns 403 Forbidden for trader role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${traderAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/v1/admin/metrics returns 200 OK for admin role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/metrics')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platformStatus).toBe('OPERATIONAL');
    });
  });

  describe('Password Reset with Expiring Single-Use Tokens', () => {
    it('forgot-password returns generic response without exposing non-existent account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost.account@virtualtrade.in' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('If an account exists');
    });

    it('completes password reset and invalidates token upon consumption', async () => {
      // 1. Request reset
      const reqRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      expect(reqRes.status).toBe(200);
      const devToken = reqRes.body.data.devResetToken;
      expect(devToken).toBeDefined();

      // 2. Reset password
      const newPassword = 'NewSecretPassword@456';
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: devToken,
          newPassword,
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Attempting to use the SAME token again fails (single-use constraint)
      const secondAttempt = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: devToken,
          newPassword: 'AnotherPassword@789',
        });

      expect(secondAttempt.status).toBe(400);
      expect(secondAttempt.body.error.message).toContain('invalid or has expired');

      // 4. Verify login with NEW password succeeds
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: newPassword,
      });

      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
    });
  });
});
