// 共享设置模块：多平台配置、模型能力、默认模型及旧设置迁移

export const PRESETS = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    getKeyUrl: 'https://platform.openai.com/',
    visionModels: ['gpt-5.5'],
    imageModels: ['gpt-image-2']
  },
  modelscope: {
    label: 'ModelScope',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    getKeyUrl: 'https://modelscope.cn/register?inviteCode=Jacka5fb&invitorName=Michael88',
    affiliateLink: true,
    visionModels: ['Qwen/Qwen3.5-122B-A10B'],
    imageModels: ['Tongyi-MAI/Z-Image-Turbo', 'krea/Krea-2-Turbo', 'Qwen/Qwen-Image-Edit-2511']
  },
  siliconflow: {
    label: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    getKeyUrl: 'https://cloud.siliconflow.cn/i/MKexoO3a',
    affiliateLink: true,
    visionModels: ['moonshotai/Kimi-K2.7-Code', 'Qwen/Qwen3.5-122B-A10B'],
    imageModels: ['Tongyi-MAI/Z-Image-Turbo', 'baidu/ERNIE-Image-Turbo']
  },
  agnes: {
    label: 'Agnes-AI',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    getKeyUrl: 'https://app.agnes-ai.com/referral/BGBUCS',
    affiliateLink: true,
    visionModels: ['agnes-2.0-flash'],
    imageModels: ['agnes-image-2.0-flash', 'agnes-image-2.1-flash']
  },
  zenmux: {
    label: 'ZenMux',
    baseUrl: 'https://zenmux.ai/api/v1',
    getKeyUrl: 'https://zenmux.ai/invite/JFPFRA',
    affiliateLink: true,
    visionModels: ['qwen/qwen3.7-plus', 'openai/gpt-5.5', 'x-ai/grok-4.5'],
    imageModels: ['openai/gpt-image-2']
  },
  atlascloud: {
    label: 'AtlasCloud',
    baseUrl: 'https://api.atlascloud.ai/v1',
    getKeyUrl: 'https://www.atlascloud.ai?ref=MP4TE3',
    affiliateLink: true,
    visionModels: ['openai/gpt-5.5', 'qwen/qwen3.5-122b-a10b'],
    imageModels: [
      'openai/gpt-image-2/text-to-image',
      'z-image/turbo',
      'baidu/ERNIE-Image-Turbo/text-to-image',
      'google/nano-banana-2-lite/edit',
      'openai/gpt-image-2/edit'
    ]
  },
  runninghub: {
    label: 'RunningHUB',
    baseUrl: 'https://www.runninghub.ai',
    getKeyUrl: 'https://www.runninghub.ai?inviteCode=40cc67d6',
    affiliateLink: true,
    visionModels: ['qwen/qwen3.7-plus'],
    imageModels: [
      'rhart-image-g-2/image-to-image',
      'rhart-image-g-2/text-to-image',
      'rhart-image-n-pro/edit',
      'rhart-image-n-g31-flash/image-to-image',
      'rhart-image-g-2-official/image-to-image',
      'rhart-image-n-pro-official/edit',
      'workflow/2078442367867637761',
      'workflow/2078448276088655873',
      'workflow/2080930269801361409',
      'workflow/2080965696364064770'
    ]
  },
  custom: { label: '自定义（OpenAI 兼容接口）', baseUrl: '', visionModels: [], imageModels: [] }
};

export const PRESET_REVISION = 14;

export const RATIOS = ['1:1', '3:2', '2:3', '16:9', '9:16'];

export function apiBaseUrlError(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) return '';
    return 'Base URL 必须使用 HTTPS；仅本机 localhost 调试允许 HTTP';
  } catch {
    return 'Base URL 格式不正确';
  }
}

function presetPlatform(presetId) {
  const preset = PRESETS[presetId];
  const visionModels = [...(preset.visionModels || [])];
  const imageModels = [...(preset.imageModels || [])];
  return {
    id: `platform-${presetId}`,
    preset: presetId,
    name: preset.label,
    baseUrl: preset.baseUrl,
    apiKey: '',
    models: [...new Set([...visionModels, ...imageModels])],
    visionModels,
    imageModels
  };
}

const builtinPresetIds = Object.keys(PRESETS).filter((id) => id !== 'custom');
const defaultPlatforms = builtinPresetIds.map(presetPlatform);
const defaultPlatform = defaultPlatforms[0];

export const DEFAULT_SETTINGS = {
  presetRevision: PRESET_REVISION,
  language: 'auto',
  platforms: defaultPlatforms,
  defaults: {
    vision: { platformId: defaultPlatform.id, model: PRESETS.openai.visionModels[0] },
    image: { platformId: defaultPlatform.id, model: PRESETS.openai.imageModels[0] }
  },
  showDisabledModels: true,
  sizeMap: {
    '1:1': '1024x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
    '16:9': '1536x1024',
    '9:16': '1024x1536'
  },
  defaultRatio: '1:1',
  imageQuality: 'low',
  imageResolution: '1k'
};

const IMAGE_QUALITIES = ['low', 'medium', 'high'];
const IMAGE_RESOLUTIONS = ['1k', '2k', '4k'];
const LANGUAGES = ['auto', 'zh', 'en', 'ja', 'ko'];

function cleanModels(values) {
  return [...new Set((values || []).map((v) => String(v).trim()).filter(Boolean))];
}

function normalizePlatform(platform, index = 0) {
  const legacyRunningHub = ['runninghub_llm', 'runninghub_image', 'runninghub_workflow'].includes(platform?.preset);
  let preset = legacyRunningHub ? 'runninghub' : (PRESETS[platform?.preset] ? platform.preset : 'custom');
  const models = cleanModels([
    ...(platform?.models || []),
    ...(platform?.visionModels || []),
    ...(platform?.imageModels || [])
  ]);
  return {
    id: platform?.id || `platform-${Date.now()}-${index}`,
    preset,
    name: String((legacyRunningHub ? PRESETS.runninghub.label : platform?.name) || PRESETS[preset].label || `平台 ${index + 1}`).trim(),
    baseUrl: String((legacyRunningHub ? PRESETS.runninghub.baseUrl : platform?.baseUrl) || '').trim(),
    apiKey: String(platform?.apiKey || '').trim(),
    models,
    visionModels: cleanModels(platform?.visionModels).filter((m) => models.includes(m)),
    imageModels: cleanModels(platform?.imageModels).filter((m) => models.includes(m))
  };
}

function legacyPlatform(cfg, type, index) {
  const legacyRh = ['runninghub_llm', 'runninghub_image', 'runninghub_workflow'].includes(cfg?.preset);
  const preset = legacyRh ? 'runninghub' : (PRESETS[cfg?.preset] ? cfg.preset : 'custom');
  const presetModels = PRESETS[preset]?.[`${type}Models`] || [];
  const model = String(cfg?.model || presetModels[0] || '').trim();
  return normalizePlatform({
    id: `legacy-${type}-${index}`,
    preset,
    name: PRESETS[preset]?.label || (type === 'vision' ? '原反推平台' : '原生图平台'),
    baseUrl: legacyRh ? PRESETS.runninghub.baseUrl : (cfg?.baseUrl || PRESETS[preset]?.baseUrl || ''),
    apiKey: cfg?.apiKey || '',
    models: model ? [model] : [],
    visionModels: type === 'vision' && model ? [model] : [],
    imageModels: type === 'image' && model ? [model] : []
  }, index);
}

function migrateLegacy(raw) {
  const vision = legacyPlatform(raw?.vision || {}, 'vision', 0);
  const image = legacyPlatform(raw?.image || {}, 'image', 1);
  const sameAccount = vision.preset === image.preset &&
    vision.baseUrl === image.baseUrl && vision.apiKey === image.apiKey;
  const platforms = sameAccount ? [normalizePlatform({
    ...vision,
    id: `legacy-${vision.preset}`,
    models: [...vision.models, ...image.models],
    visionModels: vision.visionModels,
    imageModels: image.imageModels
  })] : [vision, image];
  return {
    platforms,
    defaults: {
      vision: { platformId: platforms[0].id, model: vision.visionModels[0] || '' },
      image: {
        platformId: sameAccount ? platforms[0].id : platforms[1].id,
        model: image.imageModels[0] || ''
      }
    }
  };
}

function normalizeSettings(raw = {}) {
  const migrated = Array.isArray(raw.platforms) ? raw : { ...raw, ...migrateLegacy(raw) };
  let platforms = (migrated.platforms || []).map(normalizePlatform);
  if ((raw.presetRevision || 0) < PRESET_REVISION) {
    // AtlasCloud 是 revision 11 新增的平台：升级时只自动加入一次；用户在
    // revision 11 之后主动删除，后续读取不会再次恢复。
    if ((raw.presetRevision || 0) < 11 && !platforms.some((platform) => platform.preset === 'atlascloud')) {
      platforms.push(presetPlatform('atlascloud'));
    }
    const legacyRh = platforms.filter((platform) => platform.preset === 'runninghub');
    if (legacyRh.length > 1) {
      const preferred = legacyRh.find((item) => item.apiKey) || legacyRh[0];
      const merged = normalizePlatform({
        ...preferred,
        id: 'platform-runninghub',
        name: PRESETS.runninghub.label,
        baseUrl: PRESETS.runninghub.baseUrl,
        models: legacyRh.flatMap((item) => item.models),
        visionModels: legacyRh.flatMap((item) => item.visionModels),
        imageModels: legacyRh.flatMap((item) => item.imageModels)
      });
      const oldIds = new Set(legacyRh.map((item) => item.id));
      platforms = [...platforms.filter((item) => !oldIds.has(item.id)), merged];
      for (const type of ['vision', 'image']) {
        if (oldIds.has(migrated.defaults?.[type]?.platformId)) migrated.defaults[type].platformId = merged.id;
      }
    }
    platforms = platforms.map((platform) => {
      const preset = PRESETS[platform.preset];
      if (!preset || platform.preset === 'custom') return platform;
      const desired = presetPlatform(platform.preset);
      const deprecated = new Set([
        'workflow/2066009097937448961',
        ...(platform.preset === 'openai' ? ['gpt-image-1'] : []),
        ...(platform.preset === 'atlascloud' ? ['openai/gpt-5.6-luna'] : [])
      ]);
      const retainedModels = platform.models.filter((model) => !deprecated.has(model));
      const retainedVision = platform.visionModels.filter((model) => !deprecated.has(model));
      const retainedImage = platform.imageModels.filter((model) => !deprecated.has(model));
      return normalizePlatform({
        ...platform,
        models: [...desired.models, ...retainedModels],
        visionModels: [...desired.visionModels, ...retainedVision],
        imageModels: [...desired.imageModels, ...retainedImage]
      });
    });
  }
  const safePlatforms = platforms;
  const out = {
    presetRevision: PRESET_REVISION,
    language: LANGUAGES.includes(raw.language) ? raw.language : DEFAULT_SETTINGS.language,
    platforms: safePlatforms,
    defaults: {
      vision: { ...(migrated.defaults?.vision || {}) },
      image: { ...(migrated.defaults?.image || {}) }
    },
    showDisabledModels: raw.showDisabledModels !== false,
    sizeMap: { ...DEFAULT_SETTINGS.sizeMap, ...(raw.sizeMap || {}) },
    defaultRatio: RATIOS.includes(raw.defaultRatio) ? raw.defaultRatio : DEFAULT_SETTINGS.defaultRatio,
    imageQuality: IMAGE_QUALITIES.includes(raw.imageQuality) ? raw.imageQuality : DEFAULT_SETTINGS.imageQuality,
    imageResolution: IMAGE_RESOLUTIONS.includes(raw.imageResolution) ? raw.imageResolution : DEFAULT_SETTINGS.imageResolution
  };
  for (const type of ['vision', 'image']) {
    const choices = listModelChoices(out, type);
    const selected = out.defaults[type];
    if (!choices.some((c) => c.platformId === selected.platformId && c.model === selected.model)) {
      out.defaults[type] = choices[0]
        ? { platformId: choices[0].platformId, model: choices[0].model }
        : { platformId: '', model: '' };
    }
  }
  // 兼容仍读取 s.vision / s.image 的旧代码和第三方调用。
  out.vision = resolveModelConfig(out, 'vision');
  out.image = resolveModelConfig(out, 'image');
  if (out.sizeMap['16:9'] === '1344x768') out.sizeMap['16:9'] = '1536x1024';
  if (out.sizeMap['9:16'] === '768x1344') out.sizeMap['9:16'] = '1024x1536';
  return out;
}

export function listModelChoices(settings, type) {
  const key = type === 'vision' ? 'visionModels' : 'imageModels';
  return (settings?.platforms || []).flatMap((platform) => (platform[key] || []).map((model) => ({
    platformId: platform.id,
    platformName: platform.name,
    preset: platform.preset,
    model,
    label: `${platform.name} · ${model}`
  })));
}

export function supportsImageEdit({ preset = '', model = '' } = {}) {
  const name = String(model);
  if (preset === 'agnes' && /^agnes-image-2\.[01]-flash$/i.test(name)) return true;
  if (isModelScopeImageEditModel({ preset, model: name })) return true;
  return /(gpt-image|image-to-image|\/edit(?:$|[/?]))/i.test(name);
}

export function requiresSourceImage({ preset = '', model = '' } = {}) {
  const name = String(model);
  if (isModelScopeImageEditModel({ preset, model: name })) return true;
  if (preset === 'runninghub') {
    return !/^workflow\/\d+$/.test(name) && !name.endsWith('/text-to-image');
  }
  return /(image-to-image|\/edit(?:$|[/?]))/i.test(name);
}

export function isModelScopeImageEditModel({ preset = '', model = '' } = {}) {
  return preset === 'modelscope' && /qwen-image-edit/i.test(String(model));
}

export function resolveModelConfig(settings, type, selection) {
  const target = selection?.platformId && selection?.model ? selection : settings?.defaults?.[type];
  const choices = listModelChoices(settings, type);
  const choice = choices.find((c) => c.platformId === target?.platformId && c.model === target?.model) || choices[0];
  if (!choice) return { preset: 'custom', name: '', baseUrl: '', apiKey: '', model: '' };
  const platform = settings.platforms.find((p) => p.id === choice.platformId);
  const runningHub = platform.preset === 'runninghub';
  const atlasCloud = platform.preset === 'atlascloud';
  const isWorkflow = runningHub && /^workflow\/\d+$/.test(choice.model);
  return {
    preset: platform.preset,
    apiType: isWorkflow
      ? 'runninghub-workflow-v2'
      : (runningHub && type === 'image'
          ? 'runninghub-v2'
          : (atlasCloud && type === 'image' ? 'atlascloud-image-v1' : 'openai-compatible')),
    name: platform.name,
    platformId: platform.id,
    baseUrl: runningHub
      ? (type === 'vision' ? 'https://llm.runninghub.ai/v1' : 'https://www.runninghub.ai/openapi/v2')
      : platform.baseUrl,
    apiKey: platform.apiKey,
    model: choice.model
  };
}

export async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return normalizeSettings(settings || DEFAULT_SETTINGS);
}

export async function saveSettings(settings) {
  const normalized = normalizeSettings(settings);
  for (const platform of normalized.platforms) {
    const error = apiBaseUrlError(platform.baseUrl);
    if (error) throw new Error(`${platform.name || '平台'}：${error}`);
  }
  const { vision: _vision, image: _image, ...stored } = normalized;
  await chrome.storage.local.set({ settings: stored });
}

export function providerLabel(cfg) {
  if (cfg?.name) return cfg.name;
  if (cfg?.preset && PRESETS[cfg.preset] && cfg.preset !== 'custom') return PRESETS[cfg.preset].label;
  try { return new URL(cfg?.baseUrl).hostname || '自定义平台'; } catch { return '自定义平台'; }
}
