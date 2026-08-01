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
  apimart: {
    label: 'APImart',
    baseUrl: 'https://api.apimart.ai/v1',
    getKeyUrl: 'https://apimart.ai/register?aff=7NXNwV',
    visionModels: [
      'gpt-5-mini-2025-08-07',
      'gemini-2.5-flash-nothinking',
      'gpt-4.1-mini-2025-04-14'
    ],
    disabledModels: ['gpt-5-nano-2025-08-07'],
    imageModels: ['gpt-image-2-official', 'gpt-image-2', 'z-image-turbo']
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    getKeyUrl: 'https://openrouter.ai/settings/keys',
    visionModels: ['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite'],
    imageModels: ['google/gemini-3.1-flash-lite-image', 'krea/krea-2-medium-turbo'],
    imageEditModels: ['google/gemini-3.1-flash-lite-image', 'krea/krea-2-medium-turbo']
  },
  qianwenai: {
    label: 'QianwenAI',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    getKeyUrl: 'https://bailian.console.aliyun.com/?tab=model',
    visionModels: ['qwen3.7-flash', 'qwen3.5-flash'],
    imageModels: ['z-image-turbo', 'qwen-image-2.0'],
    imageEditModels: ['qwen-image-2.0']
  },
  bailian_token_plan: {
    label: 'Aliyun Token Plan',
    baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    getKeyUrl: 'https://bailian.console.aliyun.com/cn-beijing?tab=plan',
    visionModels: ['qwen3.8-max-preview', 'qwen3.7-plus', 'qwen3.6-flash'],
    imageModels: ['wan2.7-image', 'wan2.7-image-pro'],
    imageEditModels: ['wan2.7-image', 'wan2.7-image-pro']
  },
  runninghub: {
    label: 'RunningHUB',
    baseUrl: 'https://www.runninghub.ai',
    getKeyUrl: 'https://www.runninghub.ai?inviteCode=40cc67d6',
    affiliateLink: true,
    visionModels: ['qwen/qwen3.7-plus', 'bytedance/doubao-seed-2.0-lite'],
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

export const PRESET_REVISION = 27;

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
  const imageEditModels = [...(preset.imageEditModels || [])].filter((model) => imageModels.includes(model));
  const disabledModels = [...(preset.disabledModels || [])];
  return {
    id: `platform-${presetId}`,
    preset: presetId,
    listed: true,
    name: preset.label,
    baseUrl: preset.baseUrl,
    apiKey: '',
    models: [...new Set([...visionModels, ...imageModels, ...disabledModels])],
    visionModels,
    imageModels,
    imageEditModels
  };
}

export const DEFAULT_PLATFORM_PRESET_IDS = [
  'atlascloud',
  'apimart',
  'modelscope',
  'siliconflow',
  'runninghub',
  'zenmux'
];
const defaultPlatforms = DEFAULT_PLATFORM_PRESET_IDS.map(presetPlatform);
const defaultModelScopePlatform = defaultPlatforms.find((platform) => platform.preset === 'modelscope');

export const DEFAULT_SETTINGS = {
  presetRevision: PRESET_REVISION,
  language: 'auto',
  platforms: defaultPlatforms,
  defaults: {
    vision: { platformId: defaultModelScopePlatform.id, model: PRESETS.modelscope.visionModels[0] },
    image: { platformId: defaultModelScopePlatform.id, model: PRESETS.modelscope.imageModels[0] }
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

function cleanModelAliases(value, models) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const knownModels = new Set(models);
  return Object.fromEntries(Object.entries(value)
    .map(([model, alias]) => [String(model).trim(), String(alias || '').trim()])
    .filter(([model, alias]) => knownModels.has(model) && alias));
}

export function modelDisplayName(platform, model) {
  const original = String(model || '').trim();
  return String(platform?.modelAliases?.[original] || '').trim() || original;
}

function normalizePlatform(platform, index = 0) {
  const legacyRunningHub = ['runninghub_llm', 'runninghub_image', 'runninghub_workflow'].includes(platform?.preset);
  let preset = legacyRunningHub ? 'runninghub' : (PRESETS[platform?.preset] ? platform.preset : 'custom');
  const legacyBailianName = preset === 'bailian_token_plan' && platform?.name === '阿里百炼 Token Plan';
  const models = cleanModels([
    ...(platform?.models || []),
    ...(platform?.visionModels || []),
    ...(platform?.imageModels || [])
  ]);
  return {
    id: platform?.id || `platform-${Date.now()}-${index}`,
    preset,
    listed: platform?.listed,
    name: String(
      (legacyRunningHub
        ? PRESETS.runninghub.label
        : (legacyBailianName ? PRESETS.bailian_token_plan.label : platform?.name)) ||
      PRESETS[preset].label ||
      `平台 ${index + 1}`
    ).trim(),
    baseUrl: String((legacyRunningHub ? PRESETS.runninghub.baseUrl : platform?.baseUrl) || '').trim(),
    apiKey: String(platform?.apiKey || '').trim(),
    models,
    modelAliases: cleanModelAliases(platform?.modelAliases, models),
    visionModels: cleanModels(platform?.visionModels).filter((m) => models.includes(m)),
    imageModels: cleanModels(platform?.imageModels).filter((m) => models.includes(m)),
    imageEditModels: cleanModels(platform?.imageEditModels).filter((m) => models.includes(m))
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
    // APImart 是 revision 15 新增的平台。只在首次跨过该 revision 时添加，
    // 用户之后主动删除不会在后续读取时再次恢复。
    if ((raw.presetRevision || 0) < 15 && !platforms.some((platform) => platform.preset === 'apimart')) {
      platforms.push(presetPlatform('apimart'));
    }
    // OpenRouter 是 revision 21 新增的平台。升级时只自动加入一次；用户
    // 在 revision 21 之后主动删除，后续读取不会再次恢复。
    if ((raw.presetRevision || 0) < 21 && !platforms.some((platform) => platform.preset === 'openrouter')) {
      platforms.push(presetPlatform('openrouter'));
    }
    // Aliyun Token Plan 是 revision 23 新增的平台。升级时只加入一次；
    // 用户在 revision 23 之后主动删除时，不会在后续读取中恢复。
    if ((raw.presetRevision || 0) < 23 && !platforms.some((platform) => platform.preset === 'bailian_token_plan')) {
      platforms.push(presetPlatform('bailian_token_plan'));
    }
    // QianwenAI 是 revision 24 新增的平台，使用普通百炼按量付费 API Key。
    // 升级时只加入一次，之后尊重用户主动删除的平台配置。
    if ((raw.presetRevision || 0) < 24 && !platforms.some((platform) => platform.preset === 'qianwenai')) {
      platforms.push(presetPlatform('qianwenai'));
    }
    // revision 25 将 QianwenAI 预设地址改为 compatible-mode。只迁移旧预设
    // 地址，用户自行填写的业务空间域名或其他自定义地址保持不变。
    if ((raw.presetRevision || 0) < 25) {
      platforms = platforms.map((platform) => (
        platform.preset === 'qianwenai'
        && platform.baseUrl === 'https://dashscope.aliyuncs.com/api/v1'
          ? { ...platform, baseUrl: PRESETS.qianwenai.baseUrl }
          : platform
      ));
    }
    // revision 27 精简设置页默认平台：未配置密钥的其他内置平台只从
    // 列表隐藏，配置仍保留，可通过“添加接口”随时重新显示。
    if ((raw.presetRevision || 0) < 27) {
      platforms = platforms.map((platform) => ({
        ...platform,
        listed: DEFAULT_PLATFORM_PRESET_IDS.includes(platform.preset)
          || platform.preset === 'custom'
          || Boolean(platform.apiKey)
      }));
      for (const type of ['vision', 'image']) {
        const selectedPlatform = platforms.find(
          (platform) => platform.id === migrated.defaults?.[type]?.platformId
        );
        if (selectedPlatform?.listed === false) {
          const modelScope = platforms.find((platform) => platform.preset === 'modelscope');
          migrated.defaults[type] = modelScope
            ? {
                platformId: modelScope.id,
                model: PRESETS.modelscope[`${type}Models`][0] || ''
              }
            : { platformId: '', model: '' };
        }
      }
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
        imageModels: legacyRh.flatMap((item) => item.imageModels),
        imageEditModels: legacyRh.flatMap((item) => item.imageEditModels || [])
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
        ...(platform.preset === 'atlascloud' ? ['openai/gpt-5.6-luna'] : []),
        ...(platform.preset === 'openrouter' ? ['openai/gpt-image-2'] : [])
      ]);
      const disabledVision = new Set(
        platform.preset === 'apimart'
          ? ['gemini-2.5-flash-lite', 'gpt-5.2-pro', 'gpt-5-nano-2025-08-07']
          : []
      );
      const disabledImage = new Set(
        platform.preset === 'qianwenai' && (raw.presetRevision || 0) < 26
          ? ['qwen-image-2.0-pro']
          : []
      );
      const retainedModels = platform.models.filter((model) => !deprecated.has(model));
      const retainedVision = platform.visionModels.filter(
        (model) => !deprecated.has(model) && !disabledVision.has(model)
      );
      const retainedImage = platform.imageModels.filter(
        (model) => !deprecated.has(model) && !disabledImage.has(model)
      );
      return normalizePlatform({
        ...platform,
        models: [...desired.models, ...retainedModels],
        visionModels: [...desired.visionModels, ...retainedVision],
        imageModels: [...desired.imageModels, ...retainedImage],
        imageEditModels: [
          ...desired.imageEditModels,
          ...(platform.imageEditModels || []).filter((model) => !disabledImage.has(model))
        ]
      });
    });
    // revision 16 将 APImart 的默认模型切换为当前低成本选项。只迁移仍在
    // 使用旧 APImart 默认值的用户，不覆盖用户主动选择的其他模型。
    if ((raw.presetRevision || 0) < 16) {
      const apiMartPlatformIds = new Set(
        platforms.filter((platform) => platform.preset === 'apimart').map((platform) => platform.id)
      );
      if (
        apiMartPlatformIds.has(migrated.defaults?.vision?.platformId) &&
        migrated.defaults.vision.model === 'gpt-5.2-pro'
      ) {
        migrated.defaults.vision.model = PRESETS.apimart.visionModels[0];
      }
      if (
        apiMartPlatformIds.has(migrated.defaults?.image?.platformId) &&
        migrated.defaults.image.model === 'gpt-image-2'
      ) {
        migrated.defaults.image.model = PRESETS.apimart.imageModels[0];
      }
    }
    // revision 17 使用模型市场中仍可见、价格较低的 Vision 模型。仅替换
    // 已被移出预设的旧默认值，不影响用户手动选择的其他模型。
    if ((raw.presetRevision || 0) < 17) {
      const apiMartPlatformIds = new Set(
        platforms.filter((platform) => platform.preset === 'apimart').map((platform) => platform.id)
      );
      if (
        apiMartPlatformIds.has(migrated.defaults?.vision?.platformId) &&
        ['gemini-2.5-flash-lite', 'gpt-5.2-pro'].includes(migrated.defaults.vision.model)
      ) {
        migrated.defaults.vision.model = PRESETS.apimart.visionModels[0];
      }
      if (
        apiMartPlatformIds.has(migrated.defaults?.image?.platformId) &&
        migrated.defaults.image.model === 'gpt-image-2'
      ) {
        migrated.defaults.image.model = PRESETS.apimart.imageModels[0];
      }
    }
    // revision 19 默认停用 APImart GPT-5 Nano。若它正被选为默认
    // 反推模型，则切换到同平台首选模型，避免回退到其他平台。
    if ((raw.presetRevision || 0) < 19) {
      const apiMartPlatformIds = new Set(
        platforms.filter((platform) => platform.preset === 'apimart').map((platform) => platform.id)
      );
      if (
        apiMartPlatformIds.has(migrated.defaults?.vision?.platformId) &&
        migrated.defaults.vision.model === 'gpt-5-nano-2025-08-07'
      ) {
        migrated.defaults.vision.model = PRESETS.apimart.visionModels[0];
      }
    }
    // revision 20 将新装默认模型切换到 ModelScope。升级时仅替换仍在使用
    // 原 OpenAI 内置默认值的配置，不覆盖用户手动选择的其他平台或模型。
    if ((raw.presetRevision || 0) < 20) {
      const modelScopePlatform = platforms.find((platform) => platform.preset === 'modelscope');
      if (modelScopePlatform) {
        const currentVisionPlatform = platforms.find(
          (platform) => platform.id === migrated.defaults?.vision?.platformId
        );
        if (
          currentVisionPlatform?.preset === 'openai' &&
          migrated.defaults.vision.model === PRESETS.openai.visionModels[0]
        ) {
          migrated.defaults.vision = {
            platformId: modelScopePlatform.id,
            model: PRESETS.modelscope.visionModels[0]
          };
        }
        const currentImagePlatform = platforms.find(
          (platform) => platform.id === migrated.defaults?.image?.platformId
        );
        if (
          currentImagePlatform?.preset === 'openai' &&
          migrated.defaults.image.model === PRESETS.openai.imageModels[0]
        ) {
          migrated.defaults.image = {
            platformId: modelScopePlatform.id,
            model: PRESETS.modelscope.imageModels[0]
          };
        }
      }
    }
    // revision 22 更新 OpenRouter 内置生图模型。仅迁移仍在使用旧内置
    // GPT Image 2 的默认选择，不覆盖用户手动选择的其他模型。
    if ((raw.presetRevision || 0) < 22) {
      const openRouterPlatformIds = new Set(
        platforms.filter((platform) => platform.preset === 'openrouter').map((platform) => platform.id)
      );
      if (
        openRouterPlatformIds.has(migrated.defaults?.image?.platformId) &&
        migrated.defaults.image.model === 'openai/gpt-image-2'
      ) {
        migrated.defaults.image.model = PRESETS.openrouter.imageModels[0];
      }
    }
  }
  const defaultPlatformOrder = new Map(
    DEFAULT_PLATFORM_PRESET_IDS.map((preset, index) => [preset, index])
  );
  platforms = platforms
    .map((platform) => ({ ...platform, listed: platform.listed !== false }))
    .sort((left, right) => (
      (defaultPlatformOrder.get(left.preset) ?? Number.MAX_SAFE_INTEGER)
      - (defaultPlatformOrder.get(right.preset) ?? Number.MAX_SAFE_INTEGER)
    ));
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
  return (settings?.platforms || [])
    .filter((platform) => platform.listed !== false)
    .flatMap((platform) => (platform[key] || []).map((model) => ({
      platformId: platform.id,
      platformName: platform.name,
      preset: platform.preset,
      model,
      alias: String(platform.modelAliases?.[model] || '').trim(),
      imageEdit: type === 'image' && (platform.imageEditModels || []).includes(model),
      label: `${platform.name} · ${modelDisplayName(platform, model)}`
    })));
}

export function supportsImageEdit({ preset = '', model = '', imageEdit = false } = {}) {
  const name = String(model);
  if (preset === 'bailian_token_plan' && /^wan2\.7-image(?:-pro)?$/i.test(name)) return true;
  if (preset === 'qianwenai' && /^qwen-image-2\.0(?:-pro)?$/i.test(name)) return true;
  if (preset === 'agnes' && /^agnes-image-2\.[01]-flash$/i.test(name)) return true;
  if (preset === 'apimart' && /^gpt-image-2(?:-official)?$/i.test(name)) return true;
  if (preset === 'openrouter') return imageEdit === true;
  if (preset === 'atlascloud') {
    return /^(google\/nano-banana-2-lite\/edit|openai\/gpt-image-2\/edit)$/i.test(name);
  }
  if (isModelScopeImageEditModel({ preset, model: name })) return true;
  return /(gpt-image|image-to-image|\/edit(?:$|[/?]))/i.test(name);
}

export function imageEditReferenceLimit({ preset = '', model = '', imageEdit = false } = {}) {
  if (!supportsImageEdit({ preset, model, imageEdit })) return 0;
  if (preset === 'openrouter' && /^krea\/krea-2-medium-turbo$/i.test(String(model))) return 1;
  if (preset === 'openrouter' && /^google\/gemini-3\.1-flash-lite-image$/i.test(String(model))) return 14;
  if (preset === 'qianwenai' && /^qwen-image-2\.0(?:-pro)?$/i.test(String(model))) return 3;
  return Number.POSITIVE_INFINITY;
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
  const apiMart = platform.preset === 'apimart';
  const openRouter = platform.preset === 'openrouter';
  const bailianTokenPlan = platform.preset === 'bailian_token_plan';
  const qianwenAI = platform.preset === 'qianwenai';
  const apiMartGemini = apiMart && type === 'vision' && /^gemini-/i.test(choice.model);
  const apiMartResponses = apiMart && type === 'vision' && /^gpt-5\.2-pro$/i.test(choice.model);
  const isWorkflow = runningHub && /^workflow\/\d+$/.test(choice.model);
  return {
    preset: platform.preset,
    apiType: isWorkflow
      ? 'runninghub-workflow-v2'
      : (runningHub && type === 'image'
          ? 'runninghub-v2'
          : (atlasCloud && type === 'image'
              ? 'atlascloud-image-v1'
              : (openRouter && type === 'image'
                  ? 'openrouter-image-v1'
                  : (qianwenAI
                      ? (type === 'image' ? 'qianwen-image-v1' : 'qianwen-multimodal-v1')
                  : (bailianTokenPlan && type === 'image'
                      ? 'bailian-token-plan-image-v1'
                  : (apiMart
                  ? (type === 'vision'
                      ? (apiMartGemini
                          ? 'apimart-gemini-v1beta'
                          : (apiMartResponses ? 'apimart-responses-v1' : 'openai-compatible'))
                      : 'apimart-image-v1')
                  : 'openai-compatible')))))),
    name: platform.name,
    platformId: platform.id,
    baseUrl: runningHub
      ? (type === 'vision' ? 'https://llm.runninghub.ai/v1' : 'https://www.runninghub.ai/openapi/v2')
      : platform.baseUrl,
    apiKey: platform.apiKey,
    model: choice.model,
    imageEdit: choice.imageEdit === true
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
