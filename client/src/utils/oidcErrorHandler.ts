import { ToastType } from '../contexts/ToastContext';

interface OIDCErrorConfig {
  message: string;
  type: ToastType;
  duration?: number | null;
}

const OIDC_ERROR_CONFIGS: Record<string, OIDCErrorConfig> = {
  auth_failed: {
    message: "Authentication failed. This could be due to a cancelled login attempt or an expired session. Please try again.",
    type: 'error',
    duration: 8000
  },
  registration_disabled: {
    message: "New account registration is currently disabled on this ByteStash instance. Please contact your administrator.",
    type: 'error',
    duration: null
  },
  provider_error: {
    message: "The identity provider encountered an error or is unavailable. Please try again later or contact your administrator.",
    type: 'error',
    duration: 8000
  },
  config_error: {
    message: "There was an error with the SSO configuration. Please contact your administrator.",
    type: 'error',
    duration: null
  },
  default: {
    message: "An unexpected error occurred during authentication. Please try again.",
    type: 'error',
    duration: 8000
  }
};

export const handleOIDCError = (
  error: string, 
  addToast: (message: string, type: ToastType, duration?: number | null) => void,
  providerName?: string,
  additionalMessage?: string
) => {
  const config = OIDC_ERROR_CONFIGS[error] || OIDC_ERROR_CONFIGS.default;
  let message = config.message;

  if (providerName) {
    message = message.replace('identity provider', providerName);
  }

  if (additionalMessage) {
    message = `${message}\n\nError details: ${additionalMessage}`;
  }

  addToast(message, config.type, config.duration);
};