// v2 补充了“拖入无可识别生成提示词的图片会调用反推模型”的明确授权。
export const PRIVACY_CONSENT_VERSION = 2;
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
