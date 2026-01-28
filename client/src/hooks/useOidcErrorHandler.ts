import { useTranslation } from "react-i18next";
import { ToastType } from "../contexts/ToastContext";
import { useToast } from "./useToast";

interface OIDCErrorConfig {
  message: string;
  type: ToastType;
  duration?: number | null;
}

type ErrorKey = 'auth_failed'
  | 'registration_disabled'
  | 'provider_error'
  | 'config_error'
  | 'default'
  | string;

export const useOidcErrorHandler = () => {
  const { t: translate } = useTranslation('components/auth');
  const { addToast } = useToast();

  const OIDC_ERROR_CONFIGS: Record<ErrorKey, OIDCErrorConfig> = {
    auth_failed: {
      message: translate('oidc.error.auth_failed'),
      type: 'error',
      duration: 8000
    },
    registration_disabled: {
      message: translate('oidc.error.registration_disabled'),
      type: 'error',
      duration: null
    },
    provider_error: {
      message: translate('oidc.error.provider_error'),
      type: 'error',
      duration: 8000
    },
    config_error: {
      message: translate('oidc.error.config_error'),
      type: 'error',
      duration: null
    },
    default: {
      message: translate('oidc.error.default'),
      type: 'error',
      duration: 8000
    }
  };

  return (
    errorMessage: keyof typeof OIDC_ERROR_CONFIGS,
    providerName?: string,
    additionalMessage?: string
  ) => {
    const config = OIDC_ERROR_CONFIGS[errorMessage] || OIDC_ERROR_CONFIGS.default;
    let message = config.message;

    if (providerName) {
      message = message.replace('identity provider', providerName);
    }

    if (additionalMessage) {
      message = `${message}\n\nError details: ${additionalMessage}`;
    }

    addToast(message, config.type, config.duration);
  };
};