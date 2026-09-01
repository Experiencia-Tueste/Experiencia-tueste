'use client';

import { useActionState } from 'react';
import type { CustomerAuthState } from './actions';
import styles from './customer-auth.module.css';

const initialCustomerAuthState: CustomerAuthState = {
  status: 'idle',
  message: '',
};

interface CustomerAuthFormProps {
  mode: 'login' | 'register';
  action: (state: CustomerAuthState, formData: FormData) => Promise<CustomerAuthState>;
}

export default function CustomerAuthForm({ mode, action }: CustomerAuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialCustomerAuthState);
  const register = mode === 'register';

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span>Correo electrónico</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="tu@correo.com"
        />
      </label>

      <label className={styles.field}>
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete={register ? 'new-password' : 'current-password'}
          required
          minLength={8}
          maxLength={128}
          placeholder="Mínimo 8 caracteres"
        />
      </label>

      {state.message ? (
        <p
          className={state.status === 'success' ? styles.success : styles.error}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Procesando…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
