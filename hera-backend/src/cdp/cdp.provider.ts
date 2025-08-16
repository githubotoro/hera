import { CdpClient } from '@coinbase/cdp-sdk';
import { AppConfig } from '../config/config';

const CONFIG = AppConfig();

export const cdpProvider = 'CdpProvider';

export const CdpProvider = [
  {
    provide: cdpProvider,
    useFactory: async () => {
      // Validate required configuration
      if (!CONFIG.CDP_KEY_ID || !CONFIG.CDP_KEY_SECRET) {
        throw new Error(
          'Missing required CDP configuration. Please set CDP_KEY_ID and CDP_KEY_SECRET environment variables. ' +
            'See ENVIRONMENT_SETUP.md for instructions.',
        );
      }

      try {
        const cdp = new CdpClient({
          apiKeyId: CONFIG.CDP_KEY_ID,
          apiKeySecret: CONFIG.CDP_KEY_SECRET,
          walletSecret: CONFIG.CDP_WALLET_SECRET,
        });

        return cdp;
      } catch (error) {
        throw new Error(
          `Failed to initialize CDP client: ${error.message}. ` +
            'Please check your CDP API keys and ensure they are valid. ' +
            'Visit https://developer.coinbase.com/ to get your API keys.',
        );
      }
    },
  },
];
