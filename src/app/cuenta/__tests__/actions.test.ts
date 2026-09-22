import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  requestOrigin: vi.fn(),
  checkCustomerLoginRateLimit: vi.fn(),
  checkCustomerRegisterRateLimit: vi.fn(),
  createServerSupabase: vi.fn(),
  getAdminByEmail: vi.fn(),
  postSignInDestination: vi.fn(),
  safePostSignInPath: vi.fn(),
  resumePendingEngagementAfterAuth: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/config/env-server', () => ({
  loadSiteUrl: () => 'https://tueste.co',
}));
vi.mock('@/features/engagements/rate-limit', () => ({
  requestOrigin: mocks.requestOrigin,
}));
vi.mock('@/features/customer-auth/rate-limit', () => ({
  checkCustomerLoginRateLimit: mocks.checkCustomerLoginRateLimit,
  checkCustomerRegisterRateLimit: mocks.checkCustomerRegisterRateLimit,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: mocks.createServerSupabase,
}));
vi.mock('@/lib/auth/authorization', () => ({
  getAdminByEmail: mocks.getAdminByEmail,
}));
vi.mock('@/features/customer-auth/post-sign-in', () => ({
  postSignInDestination: mocks.postSignInDestination,
  safePostSignInPath: mocks.safePostSignInPath,
}));
vi.mock('@/features/customer-auth/resume-pending', () => ({
  resumePendingEngagementAfterAuth: mocks.resumePendingEngagementAfterAuth,
}));

import { loginCustomerAction, registerCustomerAction } from '../actions';

const FAKE_HEADERS = { get: vi.fn() };
const EMAIL = 'ana@tueste.co';
const PASSWORD = 'supersecreta123';

function credentialsForm(email = EMAIL, password = PASSWORD) {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

describe('loginCustomerAction — rate limit de fuerza bruta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(FAKE_HEADERS);
    mocks.requestOrigin.mockReturnValue('203.0.113.10');
    mocks.checkCustomerLoginRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createServerSupabase.mockResolvedValue(null);
  });

  it('consulta el rate limit con el origen y el correo normalizados antes de tocar Supabase', async () => {
    await loginCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(mocks.requestOrigin).toHaveBeenCalledWith(FAKE_HEADERS);
    expect(mocks.checkCustomerLoginRateLimit).toHaveBeenCalledWith('203.0.113.10', EMAIL);
  });

  it('corta temprano con 429/mensaje de espera cuando el checker bloquea, sin intentar el login', async () => {
    mocks.checkCustomerLoginRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 137,
    });

    const result = await loginCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Demasiados intentos. Inténtalo de nuevo en 137 segundos.',
    });
    // Si la llamada real a checkCustomerLoginRateLimit se elimina de
    // loginCustomerAction, este bloqueo nunca ocurre y createServerSupabase
    // sí se invoca — esta aserción es la que detecta esa regresión.
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it('falla cerrado con mensaje genérico si el checker de rate limit lanza', async () => {
    mocks.checkCustomerLoginRateLimit.mockRejectedValue(new Error('db down'));

    const result = await loginCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'El acceso de clientes aún no está disponible.',
    });
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it('continúa hacia Supabase cuando el rate limit permite la solicitud', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: new Error('bad credentials') });
    mocks.createServerSupabase.mockResolvedValue({
      auth: { signInWithPassword },
    });

    const result = await loginCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(mocks.checkCustomerLoginRateLimit).toHaveBeenCalledTimes(1);
    expect(signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
    expect(result).toEqual({ status: 'error', message: 'Correo o contraseña inválidos.' });
  });
});

describe('registerCustomerAction — rate limit de abuso de registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(FAKE_HEADERS);
    mocks.requestOrigin.mockReturnValue('203.0.113.10');
    mocks.checkCustomerRegisterRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createServerSupabase.mockResolvedValue(null);
    mocks.safePostSignInPath.mockReturnValue(null);
  });

  it('consulta el rate limit de registro con el origen y el correo antes de tocar Supabase', async () => {
    await registerCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(mocks.requestOrigin).toHaveBeenCalledWith(FAKE_HEADERS);
    expect(mocks.checkCustomerRegisterRateLimit).toHaveBeenCalledWith('203.0.113.10', EMAIL);
  });

  it('corta temprano con mensaje de espera cuando el checker bloquea, sin crear la cuenta', async () => {
    mocks.checkCustomerRegisterRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 58,
    });

    const result = await registerCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Demasiados intentos. Inténtalo de nuevo en 58 segundos.',
    });
    // Misma lógica que en login: si la llamada real desaparece del código,
    // createServerSupabase se invoca igual y esta aserción falla.
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it('falla cerrado con mensaje genérico si el checker de rate limit lanza', async () => {
    mocks.checkCustomerRegisterRateLimit.mockRejectedValue(new Error('db down'));

    const result = await registerCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'El registro de clientes aún no está disponible.',
    });
    expect(mocks.createServerSupabase).not.toHaveBeenCalled();
  });

  it('continúa hacia Supabase cuando el rate limit permite la solicitud', async () => {
    const signUp = vi.fn().mockResolvedValue({ error: null });
    mocks.createServerSupabase.mockResolvedValue({ auth: { signUp } });

    const result = await registerCustomerAction(
      { status: 'idle', message: '' },
      credentialsForm(),
    );

    expect(mocks.checkCustomerRegisterRateLimit).toHaveBeenCalledTimes(1);
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'success',
      message: 'Revisa tu correo para confirmar la cuenta y continuar.',
    });
  });
});
