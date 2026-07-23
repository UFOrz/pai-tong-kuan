export const PRIVACY_CONSENT_VERSION = 1;
const STORAGE_KEY = 'privacyConsent';

export async function hasPrivacyConsent() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Number(result?.[STORAGE_KEY]?.version || 0) >= PRIVACY_CONSENT_VERSION;
}

export async function grantPrivacyConsent() {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      version: PRIVACY_CONSENT_VERSION,
      acceptedAt: Date.now()
    }
  });
}
