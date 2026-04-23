import React, { useState, useEffect, useRef } from 'react';
import styles from './LoginForm.module.css';

const LoginForm = ({ backendUrl, googleClientId }) => {
  const [step, setStep] = useState('choice'); // 'choice', 'email', 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const otpInputs = useRef([]);

  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
  };

  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userEmail = payload.email;

      const url = `${backendUrl}/auth-google.php`;
      const authKey = import.meta.env.PUBLIC_BACKEND_AUTH_KEY;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`
        },
        body: JSON.stringify({ email: userEmail, token: response.credential })
      });

      const data = await res.json();

      if (data.success) {
        showFeedback("Acceso concedido. Redirigiendo...", "success");
        setTimeout(() => window.location.href = "/admin/dashboard", 1500);
      } else {
        showFeedback(data.message || "Error de autorización.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Google script if not present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (window.google && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn
        });
        const btnContainer = document.getElementById("google-login-btn-react");
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: "outline", size: "large", width: 350, text: "continue_with" }
          );
        }
      }
    }
  }, [googleClientId, step]);

  const sendOtp = async () => {
    if (!email || !email.includes('@')) {
      return showFeedback("Por favor ingresa un correo válido.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/send-otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (data.success) {
        setStep('otp');
        setFeedback({ message: '', type: '' });
      } else {
        showFeedback(data.message || "Error al enviar el código.");
      }
    } catch (err) {
      showFeedback("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length < 6) return showFeedback("Ingresa el código completo.");

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/verify-otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });

      const data = await res.json();
      if (data.success) {
        showFeedback("Código verificado. Redirigiendo...", "success");
        setTimeout(() => window.location.href = "/admin/dashboard", 1500);
      } else {
        showFeedback(data.message || "Código incorrecto o expirado.");
      }
    } catch (err) {
      showFeedback("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  return (
    <div className={styles.loginCard}>
      <div className={styles.loginHeader}>
        <img src="/indus3-logo.webp" alt="Indus3 Logo" className={styles.loginLogo} />
        <h1>Panel de Control</h1>
        <p>
          {step === 'choice' && "Selecciona tu método de acceso para continuar."}
          {step === 'email' && "Ingresa tu correo administrativo."}
          {step === 'otp' && "Verificación de seguridad requerida."}
        </p>
      </div>

      {step === 'choice' && (
        <div className={styles.loginStep}>
          <div className={styles.googleBtnWrapper}>
            <div id="google-login-btn-react"></div>
          </div>
          
          <div className={styles.divider}>
            <span>o accede con correo</span>
          </div>

          <button onClick={() => setStep('email')} className={`${styles.btn} ${styles.btnOutline}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Código por Correo
          </button>
        </div>
      )}

      {step === 'email' && (
        <div className={styles.loginStep}>
          <div className={styles.formGroup}>
            <label htmlFor="admin-email">Correo Electrónico</label>
            <input 
              type="email" 
              id="admin-email" 
              placeholder="ejemplo@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendOtp()}
            />
          </div>
          <div className={styles.btnGroup}>
            <button onClick={sendOtp} className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
            <button onClick={() => setStep('choice')} className={`${styles.btn} ${styles.btnText}`}>
              Volver
            </button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className={styles.loginStep}>
          <p className={styles.otpNotice}>Hemos enviado un código de 6 dígitos a <br/><strong>{email}</strong></p>
          <div className={styles.otpInputContainer}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                className={styles.otpDigit}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                ref={el => otpInputs.current[idx] = el}
              />
            ))}
          </div>
          <div className={styles.btnGroup}>
            <button onClick={verifyOtp} className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
              {loading ? "Verificando..." : "Verificar Acceso"}
            </button>
            <button onClick={() => setStep('email')} className={`${styles.btn} ${styles.btnText}`}>
              Cambiar correo
            </button>
          </div>
        </div>
      )}

      {feedback.message && (
        <div className={`${styles.feedback} ${styles[feedback.type] || styles.error}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default LoginForm;
