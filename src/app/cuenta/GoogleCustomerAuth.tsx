import { loginWithGoogleAction } from './actions';
import styles from './customer-auth.module.css';

export function GoogleCustomerAuth({ fallback }: { fallback: 'login' | 'registro' }) {
  return (
    <>
      <form action={loginWithGoogleAction} className={styles.oauthForm}>
        <input type="hidden" name="fallback" value={fallback} />
        <button className={styles.googleButton} type="submit">
          <span aria-hidden="true" className={styles.googleMark}>
            G
          </span>
          Continuar con Google
        </button>
      </form>
      <div className={styles.divider} aria-hidden="true">
        <span>o con correo</span>
      </div>
    </>
  );
}
