import { loginWithGoogleAction } from './actions';
import styles from './customer-auth.module.css';

export function GoogleCustomerAuth({
  fallback,
  nextPath,
}: {
  fallback: 'login' | 'registro';
  nextPath?: string;
}) {
  return (
    <>
      <form action={loginWithGoogleAction} className={styles.oauthForm}>
        <input type="hidden" name="fallback" value={fallback} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
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
