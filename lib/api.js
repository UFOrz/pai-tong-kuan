// API 调用层：图片抓取/归一化、提示词反推（视觉模型）、图片生成（OpenAI 兼容接口）

import { normalizeImageMime } from './image-file.js';
import { PRESETS, apiBaseUrlError, isRunningHubTextToImageModel } from './settings.js';
import { extractZipEntries } from './zip.js';

export const REVERSE_INSTRUCTION = `你是一名专业的图像逆向分析师、摄影指导、美术指导和 AI 生图提示词工程师。请深度分析用户上传的参考图片，将其反向拆解成一份能够最大限度复刻原图的生图提示词。

目标不是概括图片内容，而是尽可能实现视觉上的 1:1 复刻。必须忠实保留原图中可见的主体外观特征、构图、空间位置、姿态、表情、服装、环境、光影、色彩、材质、镜头语言和画面质感。不要擅自美化、补充、删减或改变原图。

一、逐层观察

1. 画面基础
- 判断图片类型：真实摄影、电影截图、插画、动漫、3D 渲染、广告视觉、海报或其他类型。
- 判断横竖构图、原始宽高比和画面方向。
- 描述整体视觉风格、时代特征、地域特征和情绪氛围。
- 判断画面的真实感、精致程度及后期处理方式。

2. 构图与空间
- 明确主体在画面中的精确位置、占画面比例及朝向。
- 描述景别、拍摄视角，以及前景、中景、背景中的全部可见元素。
- 描述各元素之间的遮挡、距离、大小和空间层级。
- 判断居中、三分法、对称、框架式、引导线、对角线、留白等构图方式。
- 尽可能估算关键元素在画面中的相对坐标和占比。

3. 人物或主体
- 逐一描述所有人物、动物、物体和重要元素。
- 若有人物，详细描述数量、年龄感、性别呈现、体型、身高比例、肤色、脸型、可见五官、发型、发色、妆容、表情、视线、动作、手势、身体姿态和四肢位置。
- 描述服装款式、颜色、剪裁、图案、材质、褶皱、搭配和配饰。
- 明确人物与镜头、环境及其他人物之间的互动关系。
- 只描述可见外观，不识别或猜测真实人物身份；无法确认的属性使用谨慎描述并标注不确定性。

4. 环境与物体
- 罗列所有可辨认的建筑、家具、植物、车辆、器具、装饰和细小物件。
- 描述其颜色、形状、材质、磨损、表面纹理及空间位置。
- 不忽略边缘、反射、阴影和被部分遮挡的细节。
- 描述可见的天气、季节、时间、空气状态及环境整洁程度，不补充画面外信息。

5. 光线与色彩
- 判断主光源位置、方向、高度、软硬、色温和强度。
- 描述补光、轮廓光、环境光、反射光、高光和阴影。
- 判断时间感，提取主色、辅色和点缀色并描述色彩关系。
- 分析曝光、对比度、饱和度、白平衡、动态范围、黑位和高光。
- 描述逆光、雾化、光晕、漏光、丁达尔效应或霓虹反射等实际可见效果。

6. 镜头与摄影参数
- 推测最接近的焦段、镜头类型和等效视角。
- 判断景深、焦点、虚化程度、散景形状、相机高度、拍摄距离、透视压缩或广角畸变。
- 分析运动模糊、手持抖动、快门拖影、颗粒、噪点、色差、暗角和镜头眩光。
- 准确体现手机照片、胶片、监控、DV、电影摄影、商业棚拍等实际成像特征，不擅自添加电影感或广告感。

7. 材质与画面质感
- 描述皮肤、头发、布料、金属、玻璃、塑料、木材、墙面、水面等材质表现。
- 保留皮肤纹理、衣物褶皱、灰尘、划痕、噪点、过曝、欠曝等真实瑕疵。
- 不自动加入“完美皮肤”“高级感”“电影感”等原图中不存在的效果。

8. 文字和符号
- 检查文字、数字、Logo、标志、标签、水印和屏幕内容。
- 能辨认的文字逐字记录，并注明语言、字体风格、颜色、大小、排版和位置。
- 无法辨认时标注“模糊不可辨认”，不要编造。

二、输出规则

必须严格使用下列五个标题，每个标题单独占一行，不要改名、合并或遗漏。各部分之间只需空行，不要输出 Markdown 分隔线（例如 ---、___ 或 ***）：

A. 图像复刻分析
用结构化方式列出主体、构图、环境、光线、颜色、镜头、材质、文字及容易遗漏的细节。

B. 中文完整复刻提示词
将所有可见信息整合成一段连贯、明确、可直接用于生图的中文提示词。严格按照“主体 → 动作 → 构图 → 环境 → 光线 → 色彩 → 镜头 → 材质 → 成像风格”的顺序书写，使用具体、可观察、可执行的描述，不使用空泛词汇。

C. English Full Reconstruction Prompt
提供与中文提示词信息完全一致、适合主流 AI 生图模型使用的完整英文提示词。必须保留全部关键细节，不得为了简洁而遗漏信息。只写一段正向提示词，不要在本段加入分析、参数或负面提示词。

D. 负面提示词
根据原图列出必须避免的偏差，包括主体数量错误、外观特征漂移、五官/发型/服装/姿势改变、构图偏移、镜头角度错误、背景缺失或增加、光线和色温错误、颜色偏差、材质塑料感、过度磨皮美化、手指/肢体/透视错误、多余文字/Logo/水印/物件，以及不符合原图的景深和画质。

E. 推荐生成参数
根据原图给出宽高比、建议分辨率、风格化强度、提示词遵循强度、图生图重绘强度、参考图权重、随机性建议；若模型支持，建议边缘、深度、姿态、构图或人脸外观参考等结构控制方式。

重要限制：
- 只描述参考图片中实际可见的内容，不根据常识补充画面外信息。
- 不改变人物、物体、环境和镜头关系，不识别真实人物身份。
- 不将普通画面自动改写为电影大片、商业广告或精修写真。
- 无法确定的内容使用谨慎描述并标注不确定性。
- 优先保证构图、主体轮廓、姿态、空间位置、光影方向和颜色分布准确，其次再追求局部纹理。
- 最终提示词必须足够详细，使没有看过参考图的人也能根据文字重建出高度接近的画面。`;

export const SURPRISE_PROMPT_INSTRUCTION = `You are a professional visual-prompt designer. Each time you receive this instruction, directly generate one complete prompt that can be used with a text-to-image model. Do not output a title, explanation, numbering, category label, creative process, or any additional text.

The host application will provide one selected visual category, a concrete direction for that category, and up to five recent outputs that must not be repeated. Treat the selected category as binding. Build a new subject and scene within it, follow the supplied direction, and remain clearly different from every recent output in subject, character identity, age, gender presentation, appearance, clothing, action, location, era, region, art style, composition, and color palette. Do not silently switch to a more familiar category.

Every prompt must include concrete, visualizable details for: theme and main subject, environment and background, time and place, era or regional characteristics, clothing or objects, actions and state, composition, camera distance, viewpoint, focal length or shot scale, lighting direction, color palette, material details, visual style, overall atmosphere, and image-quality requirements such as a clear focal subject, accurate proportions, natural details, and low noise.

When the selected genre includes people, clearly describe each person’s age range, gender or gender presentation, facial features, hairstyle, skin tone, clothing, pose, action, expression, gaze, hand position, and relationship to other people. Also specify the presentation method, such as studio portraiture, natural-light portraiture, street documentary, fashion editorial, cinematic still, comic character sheet, group portrait, or lifestyle snapshot. Characters should be natural, diverse, and appropriate to the setting. Avoid repeatedly using mysterious figures, robes, glowing elements, masks, mechanical devices, or surreal settings.

Use genre-appropriate language: photography prompts should emphasize realistic skin texture, natural poses, lens language, depth of field, and lighting; comic prompts should emphasize linework, panel-like composition, character design, dynamic poses, and coloring methods; illustration prompts should emphasize brushwork, paper, pigments, and composition; product, still-life, and food prompts should emphasize form, materials, arrangement, and commercial lighting; landscape, cityscape, and architectural prompts should emphasize spatial depth, scale, perspective, and ambient light.

If the scene contains a poster, sign, screen, UI, package, or any other textual element, write every piece of visible text exactly and place it in English double quotation marks, for example, "OPEN DAILY". Also specify the font style, typography, placement, size, and material. If the image does not require text, do not add readable text, watermarks, logos, brand marks, or gibberish text.

The final prompt must be objective, concrete, and richly detailed. Keep it between 450 and 750 English words, prioritize details that visibly affect the generated image, and always finish the prompt with a complete sentence within that limit. Do not use metaphors, emotional rhetoric, abstract praise, or meta-tags and drawing commands such as "8K", "masterpiece", or "best quality". Output only the final text-to-image prompt itself.`;

const SURPRISE_OUTPUT_TOKEN_LIMIT = 8000;

export const SURPRISE_GENRE_CATALOG = Object.freeze([
  { id: 'portrait-photography', group: 'people', label: 'Portrait photography', direction: 'Create a character-led portrait with a distinctive identity, setting-appropriate appearance, deliberate framing, and believable photographic lighting.' },
  { id: 'fashion-editorial', group: 'people', label: 'Fashion editorial', direction: 'Create a fashion-led scene with original styling, clear garment materials, a purposeful pose, and an editorial but physically believable environment.' },
  { id: 'everyday-lifestyle', group: 'people', label: 'Everyday lifestyle', direction: 'Create an unstaged everyday moment with natural interaction, ordinary objects, credible body language, and a location that is not a market or food venue unless explicitly required.' },
  { id: 'sports-action', group: 'people', label: 'Sports and movement', direction: 'Create a specific athletic or movement-based moment with accurate anatomy, readable action, suitable equipment, and environment-driven lighting.' },
  { id: 'stage-performance', group: 'people', label: 'Stage performance', direction: 'Create a live performance still with a specific performer, readable gesture, stage layout, practical lighting, costumes, and audience or backstage context where appropriate.' },

  { id: 'street-documentary', group: 'documentary', label: 'Street documentary', direction: 'Create a candid public-life scene centered on a distinctive human activity or urban observation; avoid markets, flower stalls, and food vendors when they appeared recently.' },
  { id: 'travel-documentary', group: 'documentary', label: 'Travel documentary', direction: 'Create a geographically specific travel observation with credible regional details, scale, weather, and human presence without defaulting to a market scene.' },
  { id: 'work-and-craft', group: 'documentary', label: 'Work and craft documentation', direction: 'Document a specific profession, workshop, tool, or making process with accurate materials, gestures, wear, and spatial organization.' },
  { id: 'regional-culture', group: 'documentary', label: 'Regional culture', direction: 'Create a respectful, place-specific cultural scene with observable clothing, architecture, objects, and activity; do not use generic festival or market clichés.' },
  { id: 'historical-scene', group: 'documentary', label: 'Historical scene', direction: 'Create a grounded scene from a clearly defined historical period with coherent clothing, tools, architecture, social behavior, and period-appropriate light.' },

  { id: 'product-photography', group: 'commercial', label: 'Product photography', direction: 'Create an original unbranded product hero image with precise form, material response, arrangement, background construction, and commercial lighting.' },
  { id: 'still-life', group: 'commercial', label: 'Still-life photography', direction: 'Create a carefully arranged still life around a fresh object theme, with tactile materials, meaningful spacing, controlled light, and no food or flowers when recently used.' },
  { id: 'food-photography', group: 'commercial', label: 'Food photography', direction: 'Create a specific culinary image with credible ingredients, preparation state, tableware, texture, and lighting; avoid market settings and vary cuisine, viewpoint, and palette.' },
  { id: 'advertising-poster', group: 'commercial', label: 'Advertising poster', direction: 'Create an original unbranded advertising visual with a clear graphic hierarchy, product or campaign subject, intentional negative space, and exact text only when essential.' },
  { id: 'editorial-graphic-design', group: 'commercial', label: 'Editorial graphic design', direction: 'Create a publication-style visual system with a concrete topic, disciplined layout, typography treatment, image or illustration relationship, and print-aware materials.' },

  { id: 'watercolor-illustration', group: 'art', label: 'Watercolor illustration', direction: 'Create a subject suited to transparent watercolor, describing paper grain, pigment blooms, edge control, layered washes, and an intentional composition.' },
  { id: 'oil-or-printmaking', group: 'art', label: 'Oil painting or printmaking', direction: 'Choose either oil painting or printmaking and create a concrete scene using medium-specific marks, surface, color handling, and composition.' },
  { id: 'comics', group: 'art', label: 'Comics', direction: 'Create a single comic-style scene or character moment with specific linework, staging, readable action, facial acting, and a coherent coloring method.' },
  { id: 'childrens-illustration', group: 'art', label: "Children's illustration", direction: 'Create an age-appropriate narrative illustration with original characters, clear action, friendly spatial storytelling, tactile medium details, and no generic fantasy clichés.' },
  { id: 'abstract-art', group: 'art', label: 'Abstract art', direction: 'Create a materially specific abstract work based on concrete shapes, rhythm, layering, edges, surface, scale, and a controlled color system rather than vague emotion words.' },

  { id: 'natural-landscape', group: 'spaces', label: 'Natural landscape', direction: 'Create a geographically and seasonally specific landscape with convincing terrain, vegetation, atmosphere, scale, weather, and natural light.' },
  { id: 'urban-cityscape', group: 'spaces', label: 'Urban cityscape', direction: 'Create a city-scale scene with a distinctive urban structure, transit or pedestrian rhythm, perspective depth, weather, and time-specific ambient light.' },
  { id: 'architecture', group: 'spaces', label: 'Architecture', direction: 'Create a focused architectural image with a defined building purpose, structural system, materials, human scale, viewpoint, and believable daylight or practical light.' },
  { id: 'interior-design', group: 'spaces', label: 'Interior design', direction: 'Create a functional interior with a clear use case, spatial circulation, furniture logic, materials, practical details, and coherent natural and artificial lighting.' },
  { id: 'industrial-infrastructure', group: 'spaces', label: 'Industrial and infrastructure', direction: 'Create a visually organized industrial, engineering, transport, or infrastructure scene with accurate scale, machinery, surfaces, safety details, and environmental conditions.' },

  { id: 'wildlife', group: 'nature-imagination', label: 'Wildlife photography', direction: 'Create a behavior-led image of a specific animal in a credible habitat with accurate anatomy, environmental interaction, camera distance, and natural light.' },
  { id: 'macro-science', group: 'nature-imagination', label: 'Macro and scientific observation', direction: 'Create a close observational image of a specific natural, material, or scientific subject with scale cues, optical behavior, texture, and controlled focus.' },
  { id: 'underwater-world', group: 'nature-imagination', label: 'Underwater world', direction: 'Create a physically credible underwater scene with a specific ecosystem or activity, depth, suspended particles, caustics, color absorption, and scale.' },
  { id: 'fantasy', group: 'nature-imagination', label: 'Grounded fantasy', direction: 'Create one original fantasy scene governed by consistent materials, anatomy, architecture, weather, and light; avoid glowing robes, masks, and generic monumental spectacle.' },
  { id: 'science-fiction', group: 'nature-imagination', label: 'Grounded science fiction', direction: 'Create one functional science-fiction scene with a clear human purpose, plausible technology, material wear, spatial logic, and restrained visual effects.' }
]);

function normalizedRandom(random) {
  const value = Number(random?.());
  if (!Number.isFinite(value)) return Math.random();
  return Math.min(0.999999999, Math.max(0, value));
}

export function selectSurpriseGenre(recentHistory = [], random = Math.random) {
  const recent = Array.isArray(recentHistory) ? recentHistory.slice(-5) : [];
  const recentIds = new Set(recent.map((item) => item?.genreId).filter(Boolean));
  let available = SURPRISE_GENRE_CATALOG.filter((item) => !recentIds.has(item.id));
  if (!available.length) available = [...SURPRISE_GENRE_CATALOG];

  const groupCounts = new Map();
  for (const item of recent) {
    const genre = SURPRISE_GENRE_CATALOG.find((candidate) => candidate.id === item?.genreId);
    if (genre) groupCounts.set(genre.group, (groupCounts.get(genre.group) || 0) + 1);
  }
  const availableGroups = [...new Set(available.map((item) => item.group))];
  const minimumCount = Math.min(...availableGroups.map((group) => groupCounts.get(group) || 0));
  const balancedGroups = availableGroups.filter((group) => (groupCounts.get(group) || 0) === minimumCount);
  const group = balancedGroups[Math.floor(normalizedRandom(random) * balancedGroups.length)];
  const candidates = available.filter((item) => item.group === group);
  return candidates[Math.floor(normalizedRandom(random) * candidates.length)];
}

export function surprisePromptRequestText({ genre, recentHistory = [] } = {}) {
  const selected = genre || SURPRISE_GENRE_CATALOG[0];
  const recent = (Array.isArray(recentHistory) ? recentHistory : [])
    .slice(-5)
    .reverse()
    .map((item, index) => {
      const label = String(item?.genreLabel || item?.genreId || 'Unknown category').trim();
      return `${index + 1}. ${label}`;
    });
  return [
    `SELECTED CATEGORY: ${selected.label}`,
    `CATEGORY DIRECTION: ${selected.direction}`,
    '',
    'RECENT CATEGORIES TO AVOID:',
    ...(recent.length ? recent : ['None.']),
    '',
    'Generate one new prompt now. Stay inside the selected category and do not switch to any recently used category listed above.'
  ].join('\n');
}

// ---------- 基础工具 ----------

export async function dataUrlFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

export async function blobFromDataUrl(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// 将图片压缩到 maxDim 以内。调用方按用途选择上限：识图 1024，图生图参考图 2048。
// 返回 { dataUrl, width, height, mime }，width/height 为原图尺寸
export async function normalizeImageBlob(blob, maxDim = 1024) {
  const bmp = await createImageBitmap(blob);
  const ow = bmp.width;
  const oh = bmp.height;
  const scale = Math.min(1, maxDim / Math.max(ow, oh)) || 1;
  const w = Math.max(1, Math.round(ow * scale));
  const h = Math.max(1, Math.round(oh * scale));
  let out = blob;
  if (scale < 1 || !/^image\/(jpeg|png|webp)$/.test(blob.type)) {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
    out = await canvas.convertToBlob({ type: 'image/webp', quality: 0.92 });
  }
  bmp.close?.();
  const dataUrl = await dataUrlFromBlob(out);
  return { dataUrl, width: ow, height: oh, mime: out.type || 'image/png' };
}

// ---------- HTTP ----------

async function requestJson(url, apiKey, {
  method = 'GET',
  body,
  headers = {},
  timeoutMs = 120000
} = {}) {
  const urlError = apiBaseUrlError(url);
  if (urlError) throw new Error(urlError);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...headers
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: ctrl.signal
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      const error = new Error('请求超时，请检查网络或代理');
      error.code = 'REQUEST_TIMEOUT';
      throw error;
    }
    throw new Error('网络请求失败：' + (e.message || e));
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = '';
    try {
      const payload = JSON.parse(text);
      msg = payload?.error?.message || payload?.message ||
        (typeof payload?.error === 'string' ? payload.error : '');
    } catch { /* ignore */ }
    if (!msg) msg = text.slice(0, 300);
    const error = new Error(`接口错误 HTTP ${resp.status}${msg ? '：' + msg : ''}`);
    error.status = resp.status;
    error.url = url;
    throw error;
  }
  return resp.json();
}

async function postJson(url, apiKey, body, timeoutMs = 120000, headers = {}) {
  return requestJson(url, apiKey, { method: 'POST', body, timeoutMs, headers });
}

function joinUrl(base, path) {
  const cleanBase = base.replace(/\/+$/, '');
  return cleanBase.endsWith(path) ? cleanBase : cleanBase + path;
}

function runningHubUrl(base, path) {
  const url = new URL(base);
  return `${url.origin}/openapi/v2/${String(path).replace(/^\/+/, '')}`;
}

function runningHubOriginUrl(base, path) {
  const url = new URL(base);
  return `${url.origin}/${String(path).replace(/^\/+/, '')}`;
}

export function atlasChatFallbackUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (url.hostname !== 'api.atlascloud.ai') return '';
    const path = url.pathname.replace(/\/+$/, '');
    if (path === '/v1' || path === '/v1/chat/completions') {
      return `${url.origin}/api/v1/chat/completions`;
    }
    if (path === '/api/v1' || path === '/api/v1/chat/completions') {
      return `${url.origin}/v1/chat/completions`;
    }
  } catch { /* 非法 URL 由实际请求报错 */ }
  return '';
}

// ---------- 提示词反推 ----------

export function reverseRequestTimeoutMs(cfg) {
  if (cfg?.preset === 'runninghub' || cfg?.preset === 'runninghub_llm') return 300000;
  try {
    if (new URL(cfg?.baseUrl).hostname === 'llm.runninghub.ai') return 300000;
  } catch { /* 非法 URL 交由请求阶段报告 */ }
  return 120000;
}

function chatCompletionText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') return part;
      return part?.text || part?.content || part?.value || '';
    }).filter(Boolean).join('\n');
  }
  return content?.text || content?.content || content?.value || '';
}

// ---------- APImart Responses 多模态协议 ----------

function apiMartPayload(data) {
  return data?.data && typeof data.data === 'object' ? data.data : (data || {});
}

function apiMartErrorMessage(data) {
  const error = data?.error || data?.data?.error;
  if (typeof error === 'string') return error;
  return error?.message || data?.message || data?.data?.message || '';
}

function assertApiMartSuccess(data, action = '请求') {
  const code = data?.code;
  if (!data?.error && (code == null || code === 200 || code === '200' || code === 'success')) return;
  throw new Error(`APImart ${action}失败：${apiMartErrorMessage(data) || `错误码 ${code}`}`);
}

function usesApiMartGemini(cfg) {
  return cfg?.apiType === 'apimart-gemini-v1beta' ||
    (cfg?.preset === 'apimart' && /^gemini-/i.test(String(cfg?.model || '')));
}

function usesApiMartResponses(cfg) {
  return cfg?.apiType === 'apimart-responses-v1' ||
    (cfg?.preset === 'apimart' && /^gpt-5\.2-pro$/i.test(String(cfg?.model || '')));
}

export function apiMartGeminiRequestBody({
  prompt,
  imageDataUrl = '',
  temperature = 0.2,
  maxTokens = 8000
}) {
  const parts = [{ text: prompt }];
  if (imageDataUrl) {
    const match = String(imageDataUrl).match(/^data:([^;,]+);base64,([\s\S]+)$/i);
    if (!match) throw new Error('APImart Gemini 图片必须是 Base64 Data URI');
    parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
  }
  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };
}

export function extractApiMartGeminiText(data) {
  const payload = apiMartPayload(data);
  const candidate = payload?.candidates?.[0];
  return {
    text: (candidate?.content?.parts || []).map((part) => part?.text || '').filter(Boolean).join('\n'),
    finishReason: candidate?.finishReason || candidate?.finish_reason || ''
  };
}

function apiMartGeminiUrl(baseUrl, model) {
  const url = new URL(baseUrl);
  return `${url.origin}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

async function requestApiMartGemini({ cfg, prompt, imageDataUrl = '', temperature, maxTokens }) {
  const data = await postJson(
    apiMartGeminiUrl(cfg.baseUrl, cfg.model),
    cfg.apiKey,
    apiMartGeminiRequestBody({ prompt, imageDataUrl, temperature, maxTokens }),
    reverseRequestTimeoutMs(cfg)
  );
  assertApiMartSuccess(data, 'Gemini');
  return extractApiMartGeminiText(data);
}

export function apiMartResponsesRequestBody({
  model,
  systemText = '',
  userText,
  imageDataUrl = '',
  temperature = 0.2,
  maxTokens = 8000
}) {
  const input = [];
  if (systemText) {
    input.push({
      role: 'system',
      content: [{ type: 'input_text', text: systemText }]
    });
  }
  const content = [{ type: 'input_text', text: userText }];
  if (imageDataUrl) content.push({ type: 'input_image', image_url: imageDataUrl });
  input.push({ role: 'user', content });
  return {
    model,
    input,
    temperature,
    max_tokens: maxTokens,
    stream: false
  };
}

export function extractApiMartResponseText(data) {
  const payload = apiMartPayload(data);
  const choice = payload?.choices?.[0];
  const choiceText = chatCompletionText(choice?.message?.content);
  if (choiceText) return {
    text: choiceText,
    finishReason: choice?.finish_reason || choice?.finishReason || ''
  };
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return { text: payload.output_text, finishReason: payload?.status || '' };
  }
  const outputText = (Array.isArray(payload?.output) ? payload.output : [])
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((item) => item?.text || item?.content || '')
    .filter(Boolean)
    .join('\n');
  return { text: outputText, finishReason: payload?.status || '' };
}

async function requestApiMartResponse({ cfg, body }) {
  const data = await postJson(joinUrl(cfg.baseUrl, '/responses'), cfg.apiKey, body, reverseRequestTimeoutMs(cfg));
  assertApiMartSuccess(data, 'Responses');
  return extractApiMartResponseText(data);
}

async function generateApiMartSurprisePrompt({ cfg, genre, recentHistory }) {
  const result = usesApiMartGemini(cfg)
    ? await requestApiMartGemini({
        cfg,
        prompt: `${SURPRISE_PROMPT_INSTRUCTION}\n\n${surprisePromptRequestText({ genre, recentHistory })}`,
        temperature: 1,
        maxTokens: SURPRISE_OUTPUT_TOKEN_LIMIT
      })
    : await requestApiMartResponse({
        cfg,
        body: apiMartResponsesRequestBody({
          model: cfg.model,
          systemText: SURPRISE_PROMPT_INSTRUCTION,
          userText: surprisePromptRequestText({ genre, recentHistory }),
          temperature: 1,
          maxTokens: SURPRISE_OUTPUT_TOKEN_LIMIT
        })
      });
  if (/^(?:length|max_tokens|incomplete)$/i.test(String(result.finishReason || ''))) {
    throw new Error('随机提示词达到模型输出上限，内容不完整，请重试');
  }
  const prompt = String(result.text || '')
    .replace(/^```(?:markdown|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!prompt) throw new Error('APImart 反推模型未返回随机提示词');
  return { prompt };
}

async function reversePromptFromApiMart({ cfg, dataUrl, language }) {
  const prompt = `${REVERSE_INSTRUCTION}\n\n${reverseLanguageInstruction(language)}`;
  const result = usesApiMartGemini(cfg)
    ? await requestApiMartGemini({
        cfg,
        prompt,
        imageDataUrl: dataUrl,
        temperature: 0.2,
        maxTokens: 8000
      })
    : await requestApiMartResponse({
        cfg,
        body: apiMartResponsesRequestBody({
          model: cfg.model,
          userText: prompt,
          imageDataUrl: dataUrl,
          temperature: 0.2,
          maxTokens: 8000
        })
      });
  const text = String(result.text || '');
  if (!text) throw new Error('APImart 反推接口未返回内容');
  if (/^(?:length|max_tokens|incomplete)$/i.test(String(result.finishReason || ''))) {
    throw new Error('反推内容达到模型输出上限，回答不完整。请重试，或选择支持更长输出的反推模型');
  }
  const parsed = parseReverseResult(text);
  parsed.promptZh = language === 'en' || parsed.promptZh === '[SKIP]' ? '' : parsed.promptZh;
  parsed.explanationLanguage = language === 'en' ? '' : language;
  const hasStructuredLead = /(?:^|\n)\s*(?:#{1,6}\s*)?\*{0,2}[AB][.、:：)]/i.test(text);
  if (hasStructuredLead && !parsed.structured) {
    throw new Error('APImart 反推接口返回的结构不完整，缺少英文完整复刻提示词，请重试');
  }
  return parsed;
}

// ---------- QianwenAI DashScope 原生多模态文本协议 ----------

export function qianwenMultimodalUrl(baseUrl) {
  const url = new URL(baseUrl);
  return `${url.origin}/api/v1/services/aigc/multimodal-generation/generation`;
}

export function qianwenMultimodalTextRequestBody({
  model,
  prompt,
  imageDataUrl = '',
  temperature = 0.2,
  maxTokens = 8000
}) {
  const content = [];
  if (imageDataUrl) content.push({ image: imageDataUrl });
  content.push({ text: String(prompt || '').trim() });
  return {
    model,
    input: {
      messages: [{ role: 'user', content }]
    },
    parameters: {
      result_format: 'message',
      temperature,
      max_tokens: maxTokens
    }
  };
}

export function extractQianwenText(data) {
  const choice = data?.output?.choices?.[0];
  const text = chatCompletionText(choice?.message?.content).trim();
  if (text) return {
    text,
    finishReason: choice?.finish_reason || ''
  };
  throw new Error(`QianwenAI 接口未返回文本${data?.message ? `：${data.message}` : ''}`);
}

async function requestQianwenText({
  cfg,
  prompt,
  imageDataUrl = '',
  temperature = 0.2,
  maxTokens = 8000
}) {
  const data = await postJson(
    qianwenMultimodalUrl(cfg.baseUrl),
    cfg.apiKey,
    qianwenMultimodalTextRequestBody({
      model: cfg.model,
      prompt,
      imageDataUrl,
      temperature,
      maxTokens
    }),
    reverseRequestTimeoutMs(cfg)
  );
  return extractQianwenText(data);
}

async function reversePromptFromQianwen({ cfg, dataUrl, language }) {
  const result = await requestQianwenText({
    cfg,
    prompt: `${REVERSE_INSTRUCTION}\n\n${reverseLanguageInstruction(language)}`,
    imageDataUrl: dataUrl
  });
  if (/^(?:length|max_tokens)$/i.test(String(result.finishReason || ''))) {
    throw new Error('反推内容达到模型输出上限，回答不完整。请重试，或选择支持更长输出的反推模型');
  }
  const parsed = parseReverseResult(result.text);
  parsed.promptZh = language === 'en' || parsed.promptZh === '[SKIP]' ? '' : parsed.promptZh;
  parsed.explanationLanguage = language === 'en' ? '' : language;
  const hasStructuredLead = /(?:^|\n)\s*(?:#{1,6}\s*)?\*{0,2}[AB][.、:：)]/i.test(result.text);
  if (hasStructuredLead && !parsed.structured) {
    throw new Error('QianwenAI 反推接口返回的结构不完整，缺少英文完整复刻提示词，请重试');
  }
  return parsed;
}

export async function generateSurprisePromptWithModel({ cfg, genre, recentHistory = [] }) {
  if (usesApiMartResponses(cfg) || usesApiMartGemini(cfg)) {
    return generateApiMartSurprisePrompt({ cfg, genre, recentHistory });
  }
  if (cfg?.apiType === 'qianwen-multimodal-v1') {
    const result = await requestQianwenText({
      cfg,
      prompt: `${SURPRISE_PROMPT_INSTRUCTION}\n\n${surprisePromptRequestText({ genre, recentHistory })}`,
      temperature: 1,
      maxTokens: SURPRISE_OUTPUT_TOKEN_LIMIT
    });
    if (/^(?:length|max_tokens)$/i.test(String(result.finishReason || ''))) {
      throw new Error('随机提示词达到模型输出上限，内容不完整，请重试');
    }
    const prompt = result.text
      .replace(/^```(?:markdown|text)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    if (!prompt) throw new Error('QianwenAI 反推模型未返回随机提示词');
    return { prompt };
  }
  const url = joinUrl(cfg.baseUrl, '/chat/completions');
  const body = {
    model: cfg.model,
    temperature: 1,
    max_tokens: SURPRISE_OUTPUT_TOKEN_LIMIT,
    // APImart 的 Chat Completions 默认启用 SSE；必须显式关闭，否则
    // 响应以 `data: {...}` 开头，无法按普通 JSON 解析。
    stream: false,
    messages: [
      { role: 'system', content: SURPRISE_PROMPT_INSTRUCTION },
      { role: 'user', content: surprisePromptRequestText({ genre, recentHistory }) }
    ]
  };
  const timeoutMs = reverseRequestTimeoutMs(cfg);
  let data;
  try {
    data = await postJson(url, cfg.apiKey, body, timeoutMs);
  } catch (error) {
    if (error?.code === 'REQUEST_TIMEOUT' && timeoutMs === 300000) {
      throw new Error('RunningHUB 随机提示词等待超过 5 分钟，请稍后重试或切换其他反推模型');
    }
    const fallbackUrl = error?.status === 404 ? atlasChatFallbackUrl(cfg.baseUrl) : '';
    if (!fallbackUrl || fallbackUrl === url) throw error;
    data = await postJson(fallbackUrl, cfg.apiKey, body, timeoutMs);
  }
  if (cfg?.preset === 'apimart') assertApiMartSuccess(data, '随机提示词');
  const responseData = cfg?.preset === 'apimart' ? apiMartPayload(data) : data;
  const choice = responseData?.choices?.[0];
  if (/^(?:length|max_tokens)$/i.test(String(choice?.finish_reason || ''))) {
    throw new Error('随机提示词达到模型输出上限，内容不完整，请重试');
  }
  const prompt = chatCompletionText(choice?.message?.content)
    .replace(/^```(?:markdown|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!prompt) throw new Error('反推模型未返回随机提示词');
  return { prompt };
}

function reverseLanguageInstruction(language) {
  if (language === 'en') return `Language override: Section B must contain only [SKIP]. Do not provide a Chinese, Japanese, Korean, or other translated explanation. Section C remains the complete English reconstruction prompt.`;
  if (language === 'ja') return `言語指定：セクションBは「B. 日本語完全再現プロンプト」とし、画像の全情報を省略せず自然で実行可能な日本語で記述してください。セクションCは同内容の完全な英語プロンプトにしてください。中国語の解説は出力しないでください。`;
  if (language === 'ko') return `언어 지정: 섹션 B의 제목을 "B. 한국어 전체 재현 프롬프트"로 작성하고, 이미지의 모든 정보를 생략하지 않은 자연스럽고 실행 가능한 한국어로 설명하세요. 섹션 C에는 동일한 내용의 완전한 영어 프롬프트를 작성하세요. 중국어 해설은 출력하지 마세요.`;
  return `语言指定：B 部分必须输出中文完整复刻提示词，C 部分输出信息完全一致的英文完整复刻提示词。`;
}

export async function reversePromptFromImage({ cfg, dataUrl, language = 'zh' }) {
  if (usesApiMartResponses(cfg) || usesApiMartGemini(cfg)) {
    return reversePromptFromApiMart({ cfg, dataUrl, language });
  }
  if (cfg?.apiType === 'qianwen-multimodal-v1') {
    return reversePromptFromQianwen({ cfg, dataUrl, language });
  }
  const url = joinUrl(cfg.baseUrl, '/chat/completions');
  const body = {
    model: cfg.model,
    temperature: 0.2,
    max_tokens: 8000,
    stream: false,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: `${REVERSE_INSTRUCTION}\n\n${reverseLanguageInstruction(language)}` },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  };
  const timeoutMs = reverseRequestTimeoutMs(cfg);
  let data;
  try {
    data = await postJson(url, cfg.apiKey, body, timeoutMs);
  } catch (error) {
    if (error?.code === 'REQUEST_TIMEOUT' && timeoutMs === 300000) {
      throw new Error('RunningHUB 反推等待超过 5 分钟，请稍后重试或临时切换其他反推模型');
    }
    const fallbackUrl = error?.status === 404 ? atlasChatFallbackUrl(cfg.baseUrl) : '';
    if (!fallbackUrl || fallbackUrl === url) throw error;
    try {
      data = await postJson(fallbackUrl, cfg.apiKey, body, timeoutMs);
    } catch (fallbackError) {
      if (fallbackError?.status === 404) {
        throw new Error(
          `Atlas Cloud 的两个 Chat Completions 路由均返回 404。模型“${cfg.model}”可能不支持图片输入，请改用支持视觉理解的聊天模型，而不是生图模型。`
        );
      }
      throw fallbackError;
    }
  }
  if (cfg?.preset === 'apimart') assertApiMartSuccess(data, '反推');
  const responseData = cfg?.preset === 'apimart' ? apiMartPayload(data) : data;
  const choice = responseData?.choices?.[0];
  const text = choice?.message?.content;
  if (!text) throw new Error('反推接口未返回内容');
  if (/^(?:length|max_tokens)$/i.test(String(choice?.finish_reason || ''))) {
    throw new Error('反推内容达到模型输出上限，回答不完整。请重试，或在平台设置中选择支持更长输出的反推模型');
  }
  const parsed = parseReverseResult(String(text));
  parsed.promptZh = language === 'en' || parsed.promptZh === '[SKIP]' ? '' : parsed.promptZh;
  parsed.explanationLanguage = language === 'en' ? '' : language;
  const hasStructuredLead = /(?:^|\n)\s*(?:#{1,6}\s*)?\*{0,2}[AB][.、:：)]/i.test(String(text));
  if (hasStructuredLead && !parsed.structured) {
    throw new Error('反推接口返回的结构不完整，缺少英文完整复刻提示词，请重试');
  }
  return parsed;
}

export function parseReverseResult(text) {
  const clean = String(text || '')
    .replace(/```(?:markdown|text)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  const stripSectionSeparators = (value) => {
    const lines = String(value || '').split('\n');
    const isSeparator = (line) => /^(?:-{3,}|_{3,}|\*{3,})$/.test(line.trim());
    while (lines.length && (!lines[0].trim() || isSeparator(lines[0]))) lines.shift();
    while (lines.length && (!lines.at(-1).trim() || isSeparator(lines.at(-1)))) lines.pop();
    return lines.join('\n').trim();
  };
  const sections = {};
  const headings = [...clean.matchAll(
    /(?:^|\n)\s*(?:#{1,6}\s*)?\*{0,2}([A-E])[.、:：)]\s*[^\n]*?\*{0,2}\s*(?=\n|$)/gi
  )];
  headings.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = headings[index + 1]?.index ?? clean.length;
    sections[match[1].toUpperCase()] = stripSectionSeparators(clean.slice(start, end));
  });

  if (sections.C) {
    return {
      promptEn: sections.C,
      promptZh: sections.B || '',
      analysis: sections.A || '',
      negativePrompt: sections.D || '',
      recommendedParams: sections.E || '',
      structured: true,
      raw: text
    };
  }

  // 兼容旧模型未遵循 A-E 标题时的历史输出格式。
  let en = clean;
  let zh = '';
  const marker = clean.match(/(?:中文解读|中文说明|中文翻译|解读)\s*[:：]/);
  if (marker?.index != null) {
    en = stripSectionSeparators(clean.slice(0, marker.index));
    zh = stripSectionSeparators(clean.slice(marker.index + marker[0].length));
  }
  en = en
    .replace(/^(english\s+)?(prompt|提示词)\s*[:：]\s*/i, '')
    .trim();
  return {
    promptEn: en,
    promptZh: zh,
    analysis: '',
    negativePrompt: '',
    recommendedParams: '',
    structured: false,
    raw: text
  };
}

// ---------- 图片生成 ----------

function isModelScope(cfg) {
  if (cfg?.preset === 'modelscope') return true;
  try {
    return new URL(cfg?.baseUrl).hostname === 'api-inference.modelscope.cn';
  } catch {
    return false;
  }
}

async function imageResultFromUrl(url, revisedPrompt = '', {
  maxAttempts = 4,
  retryDelayMs = 1500,
  timeoutMs = 60000,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
  const attempts = Math.max(1, Number(maxAttempts) || 1);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!response.ok) {
        const error = new Error('下载生成图失败 HTTP ' + response.status);
        error.status = response.status;
        throw error;
      }
      return imageResultFromBlob(await response.blob(), revisedPrompt);
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? new Error('下载生成图超时')
        : error instanceof Error ? error : new Error(String(error));
      const retryableStatus = !lastError.status || [404, 408, 425, 429, 500, 502, 503, 504].includes(lastError.status);
      if (attempt >= attempts || !retryableStatus) throw lastError;
      await wait(retryDelayMs * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('下载生成图失败');
}

async function imageResultFromBlob(inputBlob, revisedPrompt = '') {
  const blob = await normalizeImageMime(inputBlob);
  const bmp = await createImageBitmap(blob);
  const width = bmp.width;
  const height = bmp.height;
  bmp.close?.();
  return {
    dataUrl: await dataUrlFromBlob(blob),
    width,
    height,
    mime: blob.type || 'image/png',
    revisedPrompt
  };
}

const RUNNINGHUB_WORKFLOW_MAX_DOWNLOAD_SIZE = 128 * 1024 * 1024;

function runningHubWorkflowSizeError() {
  const error = new Error('RunningHUB 工作流生成结果过大，已停止下载');
  error.code = 'DOWNLOAD_SIZE_LIMIT';
  error.retryable = false;
  return error;
}

export async function responseBlobWithLimit(response, maxBytes = RUNNINGHUB_WORKFLOW_MAX_DOWNLOAD_SIZE) {
  const declaredSize = Number(response.headers?.get?.('content-length') || 0);
  if (declaredSize > maxBytes) throw runningHubWorkflowSizeError();
  if (!response.body?.getReader) {
    const blob = await response.blob();
    if (blob.size > maxBytes) throw runningHubWorkflowSizeError();
    return blob;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('download size limit').catch(() => {});
        throw runningHubWorkflowSizeError();
      }
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return new Blob(chunks, { type: response.headers?.get?.('content-type') || '' });
}

function looksLikeZipDownload(blob, url = '') {
  const mime = String(blob?.type || '').toLowerCase().split(';')[0].trim();
  if (['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'].includes(mime)) return true;
  if (/\.zip(?:$|[?#])/i.test(String(url || ''))) return true;
  return blob.slice(0, 4).arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    return bytes.length === 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      ((bytes[2] === 0x03 && bytes[3] === 0x04) ||
       (bytes[2] === 0x05 && bytes[3] === 0x06) ||
       (bytes[2] === 0x07 && bytes[3] === 0x08));
  });
}

export async function imageResultsFromRunningHubWorkflowDownload(blob, url = '') {
  if (!await looksLikeZipDownload(blob, url)) return [await imageResultFromBlob(blob)];
  const entries = await extractZipEntries(blob);
  const imageEntries = entries.filter((entry) => /\.(?:png|jpe?g|webp|gif|avif)$/i.test(entry.name));
  if (!imageEntries.length) throw new Error('RunningHUB 工作流返回的 ZIP 中没有可用图片');
  const results = [];
  let firstError = null;
  for (const entry of imageEntries) {
    try {
      results.push(await imageResultFromBlob(new Blob([entry.data])));
    } catch (error) {
      firstError ||= error;
    }
  }
  if (!results.length) {
    throw new Error('RunningHUB 工作流返回的 ZIP 中没有可解码图片' + (firstError?.message ? `：${firstError.message}` : ''));
  }
  return results;
}

async function runningHubWorkflowResultFromUrl(url, {
  maxAttempts = 4,
  retryDelayMs = 1500,
  timeoutMs = 60000,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
  const attempts = Math.max(1, Number(maxAttempts) || 1);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!response.ok) {
        const error = new Error('下载生成结果失败 HTTP ' + response.status);
        error.status = response.status;
        throw error;
      }
      const images = await imageResultsFromRunningHubWorkflowDownload(await responseBlobWithLimit(response), url);
      return images.length === 1 ? images[0] : { ...images[0], images };
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? new Error('下载生成结果超时')
        : error instanceof Error ? error : new Error(String(error));
      const retryableStatus = lastError.retryable !== false
        && (!lastError.status || [404, 408, 425, 429, 500, 502, 503, 504].includes(lastError.status));
      if (attempt >= attempts || !retryableStatus) throw lastError;
      await wait(retryDelayMs * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('下载生成结果失败');
}

// ---------- Aliyun Token Plan 万相图片协议 ----------

const BAILIAN_TOKEN_PLAN_IMAGE_PATH = '/api/v1/services/aigc/multimodal-generation/generation';

export function qianwenImageSize(ratio = '1:1', resolution = '1k') {
  const highResolution = ['2k', '4k'].includes(String(resolution).toLowerCase());
  if (highResolution) {
    if (ratio === '16:9') return '2688*1536';
    if (ratio === '9:16') return '1536*2688';
    if (ratio === '3:2') return '2496*1664';
    if (ratio === '2:3') return '1664*2496';
    return '2048*2048';
  }
  if (ratio === '16:9') return '1344*768';
  if (ratio === '9:16') return '768*1344';
  if (ratio === '3:2') return '1248*832';
  if (ratio === '2:3') return '832*1248';
  return '1024*1024';
}

export function qianwenImageRequestBody({
  model,
  prompt,
  ratio = '1:1',
  resolution = '1k',
  sourceDataUrl = '',
  referenceDataUrl = ''
}) {
  if (referenceDataUrl && !sourceDataUrl) {
    throw new Error('QianwenAI 图片编辑缺少需要编辑的原图');
  }
  const content = [];
  if (sourceDataUrl) content.push({ image: sourceDataUrl });
  if (referenceDataUrl) content.push({ image: referenceDataUrl });
  content.push({ text: String(prompt || '').trim() });
  return {
    model,
    input: {
      messages: [{ role: 'user', content }]
    },
    parameters: {
      size: qianwenImageSize(ratio, resolution),
      n: 1,
      prompt_extend: false,
      watermark: false
    }
  };
}

export function extractQianwenImageUrl(data) {
  const content = data?.output?.choices?.[0]?.message?.content;
  const item = (Array.isArray(content) ? content : []).find((part) => part?.image);
  if (item?.image) return item.image;
  throw new Error(`QianwenAI 生图未返回图片${data?.message ? `：${data.message}` : ''}`);
}

async function runQianwenImage({
  cfg,
  prompt,
  ratio,
  resolution = '1k',
  sourceDataUrl = '',
  referenceDataUrl = ''
}) {
  const [normalizedSourceDataUrl, normalizedReferenceDataUrl] = await Promise.all([
    ensureBailianTokenPlanImageResolution(sourceDataUrl),
    ensureBailianTokenPlanImageResolution(referenceDataUrl)
  ]);
  const data = await postJson(
    qianwenMultimodalUrl(cfg.baseUrl),
    cfg.apiKey,
    qianwenImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      resolution,
      sourceDataUrl: normalizedSourceDataUrl,
      referenceDataUrl: normalizedReferenceDataUrl
    }),
    300000
  );
  const resultUrl = extractQianwenImageUrl(data);
  try {
    const result = await imageResultFromUrl(resultUrl);
    return { ...result, size: qianwenImageSize(ratio, resolution).replace('*', 'x') };
  } catch (error) {
    throw new Error('QianwenAI 已生成图片，但下载结果失败：' + (error?.message || error));
  }
}

export async function generateQianwenImage({ cfg, prompt, ratio, resolution }) {
  return runQianwenImage({ cfg, prompt, ratio, resolution });
}

export async function generateQianwenImageEdit({
  cfg,
  prompt,
  ratio,
  resolution,
  sourceDataUrl,
  referenceDataUrl = ''
}) {
  if (!sourceDataUrl) throw new Error('QianwenAI 图片编辑缺少需要编辑的原图');
  return runQianwenImage({
    cfg,
    prompt,
    ratio,
    resolution,
    sourceDataUrl,
    referenceDataUrl
  });
}

export function bailianTokenPlanImageUrl(baseUrl) {
  const url = new URL(baseUrl);
  return `${url.origin}${BAILIAN_TOKEN_PLAN_IMAGE_PATH}`;
}

export function bailianTokenPlanImageSize(ratio = '1:1') {
  if (['3:2', '16:9'].includes(ratio)) return '1344*768';
  if (['2:3', '9:16'].includes(ratio)) return '768*1344';
  return '1024*1024';
}

export function bailianTokenPlanImageRequestBody({
  model,
  prompt,
  ratio = '1:1',
  sourceDataUrl = '',
  referenceDataUrl = ''
}) {
  if (referenceDataUrl && !sourceDataUrl) {
    throw new Error('Aliyun Token Plan 图片编辑缺少需要编辑的原图');
  }
  const content = [];
  // 百炼按数组顺序解释图片：图1为编辑底图，图2为角色/物品参考图。
  if (sourceDataUrl) content.push({ image: sourceDataUrl });
  if (referenceDataUrl) content.push({ image: referenceDataUrl });
  content.push({ text: String(prompt || '').trim() });
  return {
    model,
    input: {
      messages: [{ role: 'user', content }]
    },
    parameters: {
      size: bailianTokenPlanImageSize(ratio),
      n: 1
    }
  };
}

export function extractBailianTokenPlanImageUrl(data) {
  const choices = Array.isArray(data?.output?.choices) ? data.output.choices : [];
  for (const choice of choices) {
    const content = Array.isArray(choice?.message?.content) ? choice.message.content : [];
    const item = content.find((part) => part?.image || part?.url);
    if (item?.image || item?.url) return item.image || item.url;
  }
  const message = data?.message || data?.output?.message || data?.code;
  throw new Error(`Aliyun Token Plan 生图未返回图片${message ? `：${message}` : ''}`);
}

export async function ensureBailianTokenPlanImageResolution(
  imageDataUrl,
  { minimum = 240, target = 256 } = {}
) {
  if (!imageDataUrl) return '';
  const blob = await blobFromDataUrl(imageDataUrl);
  const bitmap = await createImageBitmap(blob);
  try {
    const width = Number(bitmap.width) || 0;
    const height = Number(bitmap.height) || 0;
    if (width >= minimum && height >= minimum) return imageDataUrl;
    if (!width || !height) throw new Error('图片尺寸无效');
    const idealScale = Math.max(target / width, target / height);
    const scale = Math.min(idealScale, 4096 / Math.max(width, height));
    const drawWidth = Math.max(1, Math.round(width * scale));
    const drawHeight = Math.max(1, Math.round(height * scale));
    const outputWidth = Math.max(target, drawWidth);
    const outputHeight = Math.max(target, drawHeight);
    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建图片缩放画布');
    context.drawImage(
      bitmap,
      Math.round((outputWidth - drawWidth) / 2),
      Math.round((outputHeight - drawHeight) / 2),
      drawWidth,
      drawHeight
    );
    const output = await canvas.convertToBlob({ type: 'image/png' });
    return dataUrlFromBlob(output);
  } catch (error) {
    throw new Error('Aliyun Token Plan 参考图尺寸处理失败：' + (error?.message || error));
  } finally {
    bitmap.close?.();
  }
}

async function runBailianTokenPlanImage({ cfg, prompt, ratio, sourceDataUrl = '', referenceDataUrl = '' }) {
  const [normalizedSourceDataUrl, normalizedReferenceDataUrl] = await Promise.all([
    ensureBailianTokenPlanImageResolution(sourceDataUrl),
    ensureBailianTokenPlanImageResolution(referenceDataUrl)
  ]);
  const data = await postJson(
    bailianTokenPlanImageUrl(cfg.baseUrl),
    cfg.apiKey,
    bailianTokenPlanImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      sourceDataUrl: normalizedSourceDataUrl,
      referenceDataUrl: normalizedReferenceDataUrl
    }),
    300000
  );
  const resultUrl = extractBailianTokenPlanImageUrl(data);
  try {
    // 返回的是短期签名链接，必须在响应后立即转存到扩展本地相册。
    const result = await imageResultFromUrl(resultUrl);
    return { ...result, size: bailianTokenPlanImageSize(ratio).replace('*', 'x') };
  } catch (error) {
    throw new Error('Aliyun Token Plan 已生成图片，但下载结果失败：' + (error?.message || error));
  }
}

export async function generateBailianTokenPlanImage({ cfg, prompt, ratio }) {
  return runBailianTokenPlanImage({ cfg, prompt, ratio });
}

export async function generateBailianTokenPlanImageEdit({
  cfg,
  prompt,
  ratio,
  sourceDataUrl,
  referenceDataUrl = ''
}) {
  if (!sourceDataUrl) throw new Error('Aliyun Token Plan 图片编辑缺少需要编辑的原图');
  return runBailianTokenPlanImage({
    cfg,
    prompt,
    ratio,
    sourceDataUrl,
    referenceDataUrl
  });
}

// ---------- APImart 图片异步协议 ----------

const APIMART_EDIT_MODELS = /^gpt-image-2(?:-official)?$/i;

function apiMartImageResolution(value, { max = '4k', upperCase = false } = {}) {
  let resolution = normalizedImageResolution(value);
  if (max === '2k' && resolution === '4k') resolution = '2k';
  return upperCase ? resolution.toUpperCase() : resolution;
}

export function apiMartImageRequestBody({
  model,
  prompt,
  ratio = '1:1',
  imageUrls = [],
  quality = 'low',
  resolution = '1k'
}) {
  const name = String(model || '').trim();
  const images = (imageUrls || []).filter(Boolean);
  if (/^z-image-turbo$/i.test(name)) {
    if (images.length) {
      throw new Error('APImart 的 z-image-turbo 不支持图片编辑，请选择 gpt-image-2 或 gpt-image-2-official');
    }
    return {
      model: name,
      prompt: String(prompt || '').slice(0, 800),
      size: ratio,
      resolution: apiMartImageResolution(resolution, { max: '2k', upperCase: true }),
      prompt_extend: false
    };
  }
  if (images.length && !APIMART_EDIT_MODELS.test(name)) {
    throw new Error(`APImart 模型“${name}”不支持图片编辑`);
  }
  const requestedResolution = normalizedImageResolution(resolution);
  const officialResolution = /^gpt-image-2-official$/i.test(name) &&
    requestedResolution === '4k' &&
    !['16:9', '9:16'].includes(ratio)
    ? '2k'
    : requestedResolution;
  const body = {
    model: name,
    prompt: String(prompt || ''),
    n: 1,
    size: ratio,
    resolution: officialResolution
  };
  if (images.length) body.image_urls = images;
  if (/^gpt-image-2-official$/i.test(name)) body.quality = normalizedImageQuality(quality);
  return body;
}

async function uploadApiMartImage({ cfg, dataUrl, index = 0 }) {
  const blob = await blobFromDataUrl(dataUrl);
  const form = new FormData();
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
  form.append('file', blob, `reference-${index + 1}.${ext}`);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  let response;
  try {
    response = await fetch(joinUrl(cfg.baseUrl, '/uploads/images'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: ctrl.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('APImart 图片上传超时');
    throw new Error('APImart 图片上传失败：' + (error?.message || error));
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`APImart 图片上传失败 HTTP ${response.status}${detail ? `：${detail.slice(0, 200)}` : ''}`);
  }
  const data = await response.json();
  const url = data?.url || data?.data?.url;
  if (!url) throw new Error('APImart 图片上传成功，但未返回图片 URL');
  return url;
}

function apiMartTaskId(data) {
  const payload = apiMartPayload(data);
  const item = Array.isArray(payload) ? payload[0] : payload;
  return String(item?.task_id || item?.taskId || payload?.task_id || payload?.taskId || '');
}

function apiMartTaskFailure(payload) {
  const status = String(payload?.status || '').toLowerCase();
  if (!['failed', 'cancelled', 'canceled', 'error'].includes(status)) return '';
  const error = payload?.error || payload?.fail_reason || payload?.failed_reason || payload?.failedReason;
  if (typeof error === 'string') return error;
  return error?.message || payload?.message || `任务状态 ${status}`;
}

function apiMartTaskImageUrl(payload) {
  const image = payload?.result?.images?.[0] || payload?.images?.[0];
  const value = image?.url ?? image?.image_url ?? image;
  if (Array.isArray(value)) return String(value[0] || '');
  return typeof value === 'string' ? value : '';
}

async function runApiMartImageTask({
  cfg,
  body,
  pollIntervalMs = 3000,
  maxPolls = 200,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const submit = await postJson(
    joinUrl(cfg.baseUrl, '/images/generations'),
    cfg.apiKey,
    body,
    120000
  );
  assertApiMartSuccess(submit, '生图提交');
  const taskId = apiMartTaskId(submit);
  if (!taskId) throw new Error('APImart 生图提交成功，但未返回 task_id');

  for (let count = 0; count < maxPolls; count += 1) {
    if (count > 0 || pollIntervalMs > 0) await wait(pollIntervalMs);
    const result = await requestJson(
      joinUrl(cfg.baseUrl, `/tasks/${encodeURIComponent(taskId)}?language=zh`),
      cfg.apiKey,
      { timeoutMs: 120000 }
    );
    assertApiMartSuccess(result, '任务查询');
    const payload = apiMartPayload(result);
    const failure = apiMartTaskFailure(payload);
    if (failure) throw new Error('APImart 生图失败：' + failure);
    const status = String(payload?.status || '').toLowerCase();
    if (status === 'completed') {
      const resultUrl = apiMartTaskImageUrl(payload);
      if (!resultUrl) throw new Error('APImart 任务已完成，但未返回图片地址');
      try {
        return await imageResultFromUrl(resultUrl, '', { wait });
      } catch (error) {
        throw new Error('APImart 任务已完成，但下载结果图片失败：' + (error?.message || error));
      }
    }
  }
  throw new Error('APImart 生图等待超过 10 分钟，请稍后重试');
}

export async function generateApiMartImage({
  cfg,
  prompt,
  ratio,
  quality,
  resolution,
  pollIntervalMs,
  maxPolls,
  wait
}) {
  return runApiMartImageTask({
    cfg,
    body: apiMartImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      quality,
      resolution
    }),
    pollIntervalMs,
    maxPolls,
    wait
  });
}

export async function generateApiMartImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  ratio,
  quality,
  resolution,
  pollIntervalMs,
  maxPolls,
  wait
}) {
  if (!sourceDataUrl) throw new Error('APImart 图片编辑缺少需要编辑的原图');
  const dataUrls = [sourceDataUrl, referenceDataUrl].filter(Boolean);
  const imageUrls = await Promise.all(
    dataUrls.map((dataUrl, index) => uploadApiMartImage({ cfg, dataUrl, index }))
  );
  return runApiMartImageTask({
    cfg,
    body: apiMartImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      imageUrls,
      quality,
      resolution
    }),
    pollIntervalMs,
    maxPolls,
    wait
  });
}

// ---------- OpenRouter 统一图片协议 ----------

export function openRouterImageRequestBody({
  model,
  prompt,
  ratio = '1:1',
  quality = 'low',
  resolution = '1k',
  sourceDataUrl = '',
  referenceDataUrl = ''
}) {
  const body = {
    model,
    prompt,
    aspect_ratio: ratio || '1:1',
    resolution: normalizedImageResolution(resolution).toUpperCase()
  };
  // OpenRouter 会按请求参数筛选提供商。Krea/Gemini 的专用图片端点不
  // 支持 quality；Krea Turbo 也未声明 n。只向明确支持这些参数的
  // OpenAI 图片模型发送，避免本来可用的提供商被参数筛选掉。
  if (/^openai\//i.test(String(model))) {
    body.n = 1;
    body.quality = normalizedImageQuality(quality);
  }
  const references = [sourceDataUrl, referenceDataUrl].filter(Boolean);
  if (references.length) {
    body.input_references = references.map((url) => ({
      type: 'image_url',
      image_url: { url }
    }));
  }
  return body;
}

async function parseOpenRouterImage(data) {
  const item = data?.data?.[0];
  if (!item) throw new Error('OpenRouter 生图接口未返回图片');
  if (item.b64_json) {
    const mediaType = /^image\//i.test(String(item.media_type || ''))
      ? item.media_type
      : 'image/png';
    const dataUrl = String(item.b64_json).startsWith('data:')
      ? item.b64_json
      : `data:${mediaType};base64,${item.b64_json}`;
    return imageResultFromBlob(await blobFromDataUrl(dataUrl), item.revised_prompt || '');
  }
  if (item.url) return imageResultFromUrl(item.url, item.revised_prompt || '');
  throw new Error('OpenRouter 生图返回格式不支持（既无 b64_json 也无 url）');
}

export async function generateOpenRouterImage({
  cfg,
  prompt,
  ratio,
  quality = 'low',
  resolution = '1k'
}) {
  const data = await postJson(
    joinUrl(cfg.baseUrl, '/images'),
    cfg.apiKey,
    openRouterImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      quality,
      resolution
    }),
    300000
  );
  return parseOpenRouterImage(data);
}

export async function generateOpenRouterImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  ratio,
  quality = 'low',
  resolution = '1k'
}) {
  if (!sourceDataUrl) throw new Error('OpenRouter 图片编辑缺少需要编辑的原图');
  const data = await postJson(
    joinUrl(cfg.baseUrl, '/images'),
    cfg.apiKey,
    openRouterImageRequestBody({
      model: cfg.model,
      prompt,
      ratio,
      quality,
      resolution,
      sourceDataUrl,
      referenceDataUrl
    }),
    300000
  );
  return parseOpenRouterImage(data);
}

// ---------- AtlasCloud 图片异步协议 ----------

function atlasCloudUrl(cfg, path) {
  const origin = new URL(cfg.baseUrl).origin;
  return `${origin}/api/v1/${String(path).replace(/^\/+/, '')}`;
}

function atlasCloudPayload(data) {
  return data?.data && typeof data.data === 'object' ? data.data : (data || {});
}

function atlasCloudErnieSize(ratio) {
  return ({
    '1:1': '1024x1024',
    '3:2': '1264x848',
    '2:3': '848x1264',
    '16:9': '1376x768',
    '9:16': '768x1376'
  })[ratio] || '1024x1024';
}

function normalizedImageQuality(value) {
  return ['low', 'medium', 'high'].includes(value) ? value : 'low';
}

function normalizedImageResolution(value) {
  return ['1k', '2k', '4k'].includes(value) ? value : '1k';
}

function atlasCloudNanoBananaRequestBody({ model, body, ratio, resolution, images }) {
  const match = /^google\/(nano-banana-2-lite|nano-banana-2|nano-banana-pro|nano-banana)\/(text-to-image(?:-developer)?|edit(?:-developer)?|text-to-image-ultra|edit-ultra)$/i.exec(String(model || ''));
  if (!match) return null;

  const family = match[1].toLowerCase();
  const mode = match[2].toLowerCase();
  const isUltra = mode.endsWith('-ultra');
  if (isUltra && family !== 'nano-banana-pro') return null;
  const isEdit = mode.startsWith('edit');
  if (isEdit && !images.length) throw new Error('AtlasCloud 图片编辑缺少来源图片');

  const request = {
    ...body,
    aspect_ratio: ratio || (family === 'nano-banana-2-lite' ? 'auto' : '1:1')
  };

  // Pro Ultra 只接受 4k/8k；当前界面最高为 4k，因此固定发送官方支持的 4k。
  if (isUltra) {
    request.resolution = '4k';
    request.output_format = 'png';
  // 原版 Nano Banana 的 schema 没有 resolution/thinking_level。
  } else if (family !== 'nano-banana') {
    request.resolution = family === 'nano-banana-2-lite'
      ? '1k'
      : normalizedImageResolution(resolution);
  }
  // Nano Banana 2 与 Lite 支持 thinking_level；原版和 Pro 不支持。
  if (family === 'nano-banana-2-lite' || family === 'nano-banana-2') {
    request.thinking_level = 'default';
  }
  if (isEdit) request.images = images;
  return request;
}

export function atlasCloudImageRequestBody({
  model,
  prompt,
  size = '1024x1024',
  ratio = '1:1',
  images = [],
  quality = 'low',
  resolution = '1k'
}) {
  const name = String(model || '');
  const body = {
    model: name,
    prompt,
    enable_sync_mode: false,
    enable_base64_output: false
  };
  const nanoBananaBody = atlasCloudNanoBananaRequestBody({ model: name, body, ratio, resolution, images });
  if (nanoBananaBody) return nanoBananaBody;
  if (/^openai\/gpt-image-2\/edit$/i.test(name)) {
    if (!images.length) throw new Error('AtlasCloud 图片编辑缺少来源图片');
    return {
      ...body,
      images,
      output_format: 'png',
      quality: normalizedImageQuality(quality),
      size,
      moderation: 'low'
    };
  }
  if (/^openai\/gpt-image-2\/text-to-image$/i.test(name)) {
    return {
      ...body,
      output_format: 'png',
      quality: normalizedImageQuality(quality),
      size,
      moderation: 'low'
    };
  }
  if (/^z-image\/turbo$/i.test(name)) {
    return {
      ...body,
      prompt_extend: false,
      seed: -1,
      size: String(size || '1024x1024').replace(/x/i, '*')
    };
  }
  if (/^baidu\/ERNIE-Image-Turbo\/text-to-image$/i.test(name)) {
    return {
      ...body,
      size: atlasCloudErnieSize(ratio),
      n: 1,
      seed: -1,
      use_pe: true,
      num_inference_steps: 8,
      guidance_scale: 1
    };
  }
  return { ...body, size };
}

async function uploadAtlasCloudImage({ cfg, dataUrl, index = 0 }) {
  const blob = await blobFromDataUrl(dataUrl);
  const form = new FormData();
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
  form.append('file', blob, `reference-${index + 1}.${ext}`);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  let response;
  try {
    response = await fetch(atlasCloudUrl(cfg, 'model/uploadMedia'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: ctrl.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('AtlasCloud 图片上传超时');
    throw new Error('AtlasCloud 图片上传失败：' + (error?.message || error));
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`AtlasCloud 图片上传失败 HTTP ${response.status}${detail ? `：${detail.slice(0, 200)}` : ''}`);
  }
  const data = await response.json();
  const payload = atlasCloudPayload(data);
  const url = payload.download_url || payload.downloadUrl || payload.url;
  if (!url) throw new Error('AtlasCloud 图片上传成功，但未返回 download_url');
  return url;
}

function atlasCloudFailure(payload) {
  const status = String(payload?.status || '').toLowerCase();
  if (['failed', 'failure', 'error', 'timeout', 'cancelled'].includes(status)) {
    return payload?.error || payload?.message || `任务状态 ${status}`;
  }
  return '';
}

async function runAtlasCloudImageTask({
  cfg,
  body,
  pollIntervalMs = 2000,
  maxPolls = 300,
  downloadAttempts = 4,
  downloadRetryDelayMs = 1500,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const submit = await postJson(atlasCloudUrl(cfg, 'model/generateImage'), cfg.apiKey, body, 120000);
  const submitPayload = atlasCloudPayload(submit);
  const submitCode = Number(submit?.code ?? 0);
  if (submitCode && ![200].includes(submitCode)) {
    throw new Error('AtlasCloud 提交失败：' + (submit?.message || `错误码 ${submitCode}`));
  }
  const predictionId = submitPayload.id || submitPayload.prediction_id;
  if (!predictionId) throw new Error('AtlasCloud 未返回 prediction ID');

  let payload = submitPayload;
  for (let count = 0; count < maxPolls; count += 1) {
    const failure = atlasCloudFailure(payload);
    if (failure) throw new Error('AtlasCloud 生图失败：' + failure);
    const status = String(payload?.status || '').toLowerCase();
    const output = payload?.outputs?.[0];
    if (['completed', 'succeeded', 'success'].includes(status) && output) {
      try {
        return await imageResultFromUrl(output, '', {
          maxAttempts: downloadAttempts,
          retryDelayMs: downloadRetryDelayMs,
          wait
        });
      } catch (error) {
        throw new Error(`AtlasCloud 任务已完成，但下载结果图片失败（已重试 ${downloadAttempts} 次）：${error?.message || error}`);
      }
    }
    if (count > 0 || pollIntervalMs > 0) await wait(pollIntervalMs);
    const result = await requestJson(
      atlasCloudUrl(cfg, `model/prediction/${encodeURIComponent(predictionId)}`),
      cfg.apiKey,
      { timeoutMs: 120000 }
    );
    payload = atlasCloudPayload(result);
  }
  throw new Error('AtlasCloud 生图等待超过 10 分钟，请稍后重试');
}

export async function generateAtlasCloudImage({
  cfg, prompt, size, ratio, quality, resolution, pollIntervalMs, maxPolls,
  downloadAttempts, downloadRetryDelayMs, wait
}) {
  return runAtlasCloudImageTask({
    cfg,
    body: atlasCloudImageRequestBody({ model: cfg.model, prompt, size, ratio, quality, resolution }),
    pollIntervalMs,
    maxPolls,
    downloadAttempts,
    downloadRetryDelayMs,
    wait
  });
}

export async function generateAtlasCloudImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  size,
  ratio,
  quality,
  resolution,
  pollIntervalMs,
  maxPolls,
  downloadAttempts,
  downloadRetryDelayMs,
  wait
}) {
  if (!sourceDataUrl) throw new Error('AtlasCloud 图片编辑缺少需要编辑的原图');
  const dataUrls = [sourceDataUrl, referenceDataUrl].filter(Boolean);
  const images = await Promise.all(dataUrls.map((dataUrl, index) => uploadAtlasCloudImage({ cfg, dataUrl, index })));
  return runAtlasCloudImageTask({
    cfg,
    body: atlasCloudImageRequestBody({ model: cfg.model, prompt, size, ratio, images, quality, resolution }),
    pollIntervalMs,
    maxPolls,
    downloadAttempts,
    downloadRetryDelayMs,
    wait
  });
}

async function runModelScopeImageTask({
  cfg,
  body,
  taskLabel = '生图',
  pollIntervalMs = 2000,
  maxPolls = 150,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const submit = await postJson(
    joinUrl(cfg.baseUrl, '/images/generations'),
    cfg.apiKey,
    body,
    120000,
    { 'X-ModelScope-Async-Mode': 'true' }
  );
  const taskId = submit?.task_id || submit?.taskId;
  if (!taskId) throw new Error(`ModelScope ${taskLabel}接口未返回 task_id`);

  for (let count = 0; count < maxPolls; count += 1) {
    if (count > 0 || pollIntervalMs > 0) await wait(pollIntervalMs);
    const result = await requestJson(
      joinUrl(cfg.baseUrl, `/tasks/${encodeURIComponent(taskId)}`),
      cfg.apiKey,
      {
        headers: { 'X-ModelScope-Task-Type': 'image_generation' },
        timeoutMs: 120000
      }
    );
    const status = String(result?.task_status || result?.taskStatus || result?.status || '').toUpperCase();
    if (['FAILED', 'FAILURE', 'ERROR', 'CANCELLED'].includes(status)) {
      throw new Error(`ModelScope ${taskLabel}失败：` + modelScopeFailureReason(result));
    }
    if (['SUCCEED', 'SUCCESS', 'COMPLETED'].includes(status)) {
      const output = result?.output_images?.[0];
      const imageUrl = typeof output === 'string' ? output : output?.url;
      if (!imageUrl) throw new Error('ModelScope 任务成功，但未返回 output_images');
      return imageResultFromUrl(imageUrl);
    }
  }
  throw new Error(`ModelScope ${taskLabel}等待超过 5 分钟，请稍后重试`);
}

export async function generateModelScopeImage({
  cfg,
  prompt,
  size,
  pollIntervalMs = 2000,
  maxPolls = 150,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const body = {
    model: normalizeModelScopeModelId(cfg.model),
    prompt: limitModelScopePrompt(prompt)
  };
  if (size) body.size = size;
  return runModelScopeImageTask({ cfg, body, pollIntervalMs, maxPolls, wait });
}

export function modelScopeImageEditRequestBody({
  model,
  prompt,
  sourceDataUrl,
  referenceDataUrl = ''
}) {
  if (!sourceDataUrl) throw new Error('ModelScope 图生图缺少需要编辑的原图');
  return {
    model: normalizeModelScopeModelId(model),
    prompt: limitModelScopePrompt(prompt),
    image_url: [sourceDataUrl, referenceDataUrl].filter(Boolean)
  };
}

export async function generateModelScopeImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  pollIntervalMs = 2000,
  maxPolls = 150,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const body = modelScopeImageEditRequestBody({
    model: cfg.model,
    prompt,
    sourceDataUrl,
    referenceDataUrl
  });
  return runModelScopeImageTask({ cfg, body, taskLabel: '图生图', pollIntervalMs, maxPolls, wait });
}

// ModelScope AIGC 文档要求 prompt 长度小于 2000。详细反推提示词经常超过该限制，
// 部分模型会先返回 task_id，再在异步执行阶段以 FAILED 结束。
export function limitModelScopePrompt(prompt, maxLength = 1999) {
  const text = String(prompt || '').trim();
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  const clipped = chars.slice(0, maxLength).join('');
  const boundaries = [clipped.lastIndexOf('\n'), clipped.lastIndexOf('. '), clipped.lastIndexOf('。')];
  const boundary = Math.max(...boundaries);
  return (boundary >= Math.floor(maxLength * 0.75) ? clipped.slice(0, boundary + 1) : clipped).trim();
}

export function normalizeModelScopeModelId(model) {
  const value = String(model || '').trim();
  const normalized = value.toLowerCase();
  if (normalized === 'tongyi-mai/z-image-turbo' || normalized === 'tongyi-mai/z-image-tubo') {
    return 'Tongyi-MAI/Z-Image-Turbo';
  }
  if (normalized === 'qwen/qwen-image-edit-2511') {
    return 'Qwen/Qwen-Image-Edit-2511';
  }
  return value;
}

export function modelScopeFailureReason(result) {
  const candidates = [
    result?.message,
    result?.task_msg,
    result?.task_message,
    result?.failed_reason,
    result?.failure_reason,
    result?.error?.message,
    result?.error,
    result?.errors
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      try {
        const text = JSON.stringify(value);
        if (text && text !== '{}' && text !== '[]') return text;
      } catch { /* ignore */ }
    }
  }
  const code = result?.error_code || result?.errorCode || result?.code;
  return code ? `任务执行失败（错误码 ${code}）` : '任务执行失败；可能是提示词、尺寸、模型额度或平台负载限制';
}

export async function generateImageFromPrompt({ cfg, prompt, size, quality = 'low' }) {
  if (isModelScope(cfg)) {
    return generateModelScopeImage({ cfg, prompt, size });
  }
  const url = joinUrl(cfg.baseUrl, '/images/generations');
  const body = { model: cfg.model, prompt, n: 1 };
  if (size) body.size = size;
  if (/gpt-image/i.test(cfg.model || '')) body.quality = normalizedImageQuality(quality);
  const data = await postJson(url, cfg.apiKey, body, 300000);
  const item = data?.data?.[0];
  if (!item) throw new Error('生图接口未返回图片');

  let blob;
  if (item.b64_json) {
    blob = await blobFromDataUrl('data:image/png;base64,' + item.b64_json);
  } else if (item.url) {
    return imageResultFromUrl(item.url, item.revised_prompt || '');
  } else {
    throw new Error('生图接口返回格式不支持（既无 b64_json 也无 url）');
  }
  return imageResultFromBlob(blob, item.revised_prompt || '');
}

export function runningHubNeedsSource(model) {
  return !isRunningHubTextToImageModel(model);
}

function isRunningHubSeedreamSizeModel(model) {
  return /^(?:seedream-v5-pro|dola-seedream-5\.0-pro)\/(?:text-to-image|image-to-image)$/i.test(String(model || ''));
}

function isRunningHubFluxImageModel(model) {
  return /^rhart-image\/f-2-/i.test(String(model || ''));
}

export function runningHubSeedreamDimensions(ratio, configuredSize = '') {
  const ratioMatch = String(ratio || '').match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  const sizeMatch = String(configuredSize || '').match(/^(\d+)x(\d+)$/i);
  const rw = Number(ratioMatch?.[1] || 1);
  const rh = Number(ratioMatch?.[2] || 1);
  const configuredWidth = Number(sizeMatch?.[1] || 0);
  const configuredHeight = Number(sizeMatch?.[2] || 0);
  const configuredMatchesRatio = configuredWidth >= 1024 && configuredWidth <= 2048
    && configuredHeight >= 1024 && configuredHeight <= 2048
    && Math.abs(configuredWidth / configuredHeight - rw / rh) < 0.01;
  if (configuredMatchesRatio) {
    return { width: configuredWidth, height: configuredHeight };
  }

  const align8 = (value) => Math.round(value / 8) * 8;
  const scale = Math.max(1024 / rw, 1024 / rh);
  const width = Math.min(2048, Math.max(1024, align8(rw * scale)));
  const height = Math.min(2048, Math.max(1024, align8(rh * scale)));
  return { width, height };
}

export function runningHubRequestBody({ model, prompt, ratio, size = '', imageUrl, referenceImageUrl = '', resolution = '1k' }) {
  const body = { prompt };
  if (isRunningHubSeedreamSizeModel(model)) {
    Object.assign(body, runningHubSeedreamDimensions(ratio, size));
  } else {
    body.aspectRatio = ratio || '1:1';
  }
  body.resolution = normalizedImageResolution(resolution);
  if (isRunningHubFluxImageModel(model)) {
    body.outputFormat = 'png';
  }
  if (/^youchuan\/text-to-image-v8(?:1|2)$/i.test(String(model || ''))) {
    body.hd = false;
  }
  if (runningHubNeedsSource(model)) {
    if (!imageUrl) throw new Error('该 RunningHUB 模型需要来源图片，请先点击网页图片上的魔法按钮');
    body.imageUrls = [imageUrl, referenceImageUrl].filter(Boolean);
  }
  return body;
}

function runningHubPayload(data) {
  if (data?.data && !Array.isArray(data.data) && typeof data.data === 'object') {
    return { ...data, ...data.data };
  }
  return data || {};
}

export function extractRunningHubResultUrl(data) {
  const preferredKeys = ['url', 'fileUrl', 'download_url'];
  const seen = new Set();
  function visit(value) {
    if (!value || seen.has(value)) return '';
    if (typeof value === 'string') return /^https?:\/\//i.test(value) ? value : '';
    if (typeof value !== 'object') return '';
    seen.add(value);
    for (const key of preferredKeys) {
      const found = visit(value[key]);
      if (found) return found;
    }
    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }
    return '';
  }
  return visit(data);
}

export function runningHubWorkflowId(model) {
  return String(model || '').match(/^workflow\/(\d+)$/)?.[1] || '';
}

export function findRunningHubWorkflowPromptNode(workflow) {
  let nodes = workflow;
  if (typeof nodes === 'string') {
    try { nodes = JSON.parse(nodes); } catch { throw new Error('RunningHUB 工作流 JSON 无法解析'); }
  }
  if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) {
    throw new Error('RunningHUB 工作流 JSON 格式不正确');
  }

  const fieldPriority = ['text', 'prompt', 'positive', 'input_text', 'string', 'value'];
  const editableField = (node) => {
    const inputs = node?.inputs || {};
    for (const key of fieldPriority) {
      if (typeof inputs[key] === 'string') return key;
    }
    return '';
  };
  const linkedNodeId = (value) => Array.isArray(value) && value.length > 0 && nodes[String(value[0])]
    ? String(value[0])
    : '';
  const positiveStarts = [];
  for (const node of Object.values(nodes)) {
    const classType = String(node?.class_type || '').toLowerCase();
    if (!classType.includes('ksampler')) continue;
    const id = linkedNodeId(node?.inputs?.positive);
    if (id) positiveStarts.push(id);
  }

  const queue = [...positiveStarts];
  const visited = new Set();
  while (queue.length) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const node = nodes[nodeId];
    const fieldName = editableField(node);
    if (fieldName) return { nodeId, fieldName, description: '正向提示词' };
    for (const value of Object.values(node?.inputs || {})) {
      const upstreamId = linkedNodeId(value);
      if (upstreamId) queue.push(upstreamId);
    }
  }

  const candidates = Object.entries(nodes).map(([nodeId, node]) => {
    const fieldName = editableField(node);
    const label = `${node?.class_type || ''} ${node?._meta?.title || ''}`.toLowerCase();
    let score = fieldName ? 1 : -1000;
    if (label.includes('cliptextencode')) score += 30;
    if (label.includes('prompt') || label.includes('positive')) score += 20;
    if (label.includes('negative')) score -= 100;
    return { nodeId, fieldName, score };
  }).filter((item) => item.fieldName).sort((a, b) => b.score - a.score);
  if (!candidates.length || candidates[0].score < 20) {
    throw new Error('未能在 RunningHUB 工作流中找到可修改的正向提示词节点');
  }
  return { nodeId: candidates[0].nodeId, fieldName: candidates[0].fieldName, description: '提示词' };
}

export function findRunningHubWorkflowInputNodes(workflow) {
  let nodes = workflow;
  if (typeof nodes === 'string') {
    try { nodes = JSON.parse(nodes); } catch { throw new Error('RunningHUB 工作流 JSON 无法解析'); }
  }
  if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) {
    throw new Error('RunningHUB 工作流 JSON 格式不正确');
  }
  const specs = {
    prompt: { marker: '$prompt.text!', fieldName: 'text', description: '提示词' },
    width: { marker: '$width.value', fieldName: 'value', description: '宽度' },
    height: { marker: '$height.value', fieldName: 'value', description: '高度' }
  };
  const found = {};
  for (const [nodeId, node] of Object.entries(nodes)) {
    const title = String(node?._meta?.title || '').trim();
    for (const [key, spec] of Object.entries(specs)) {
      if (title === spec.marker) {
        found[key] = { nodeId, fieldName: spec.fieldName, description: spec.description };
      }
    }
  }
  const missing = Object.keys(specs).filter((key) => !found[key]);
  if (missing.length) {
    const labels = missing.map((key) => specs[key].marker).join('、');
    throw new Error(`RunningHUB 工作流缺少节点标题：${labels}`);
  }
  return found;
}

export function runningHubWorkflowDimensions(ratio, configuredSize = '') {
  const ratioMatch = String(ratio || '').match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  const sizeMatch = String(configuredSize || '').match(/^(\d+)x(\d+)$/i);
  const rw = Number(ratioMatch?.[1] || 1);
  const rh = Number(ratioMatch?.[2] || 1);
  const configuredWidth = Number(sizeMatch?.[1] || 1024);
  const configuredHeight = Number(sizeMatch?.[2] || 1024);
  if (Math.abs(configuredWidth / configuredHeight - rw / rh) < 0.01) {
    return { width: configuredWidth, height: configuredHeight };
  }
  const longEdge = Math.max(configuredWidth, configuredHeight, 1024);
  const align8 = (value) => Math.max(8, Math.round(value / 8) * 8);
  return rw >= rh
    ? { width: longEdge, height: align8(longEdge * rh / rw) }
    : { width: align8(longEdge * rw / rh), height: longEdge };
}

export function runningHubWorkflowRequestBody({ inputNodes, prompt, ratio, size }) {
  const dimensions = runningHubWorkflowDimensions(ratio, size);
  // RunningHub 的 nodeInfoList 示例会把可编辑节点值统一序列化为字符串。
  // 部分 V2 工作流节点收到 JSON number 时不会报错，但会静默保留工作流默认值。
  const nodeOverride = (node, fieldValue) => ({
    nodeId: String(node.nodeId),
    fieldName: String(node.fieldName),
    fieldValue: String(fieldValue)
  });
  return {
    addMetadata: true,
    nodeInfoList: [
      nodeOverride(inputNodes.prompt, prompt),
      nodeOverride(inputNodes.width, dimensions.width),
      nodeOverride(inputNodes.height, dimensions.height)
    ],
    instanceType: 'default',
    usePersonalQueue: 'false'
  };
}

async function uploadRunningHubImage({ cfg, dataUrl }) {
  const blob = await blobFromDataUrl(dataUrl);
  const form = new FormData();
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
  form.append('file', blob, `source.${ext}`);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  let resp;
  try {
    resp = await fetch(runningHubUrl(cfg.baseUrl, 'media/upload/binary'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: ctrl.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('RunningHUB 来源图片上传超时');
    throw new Error('RunningHUB 来源图片上传失败：' + (error.message || error));
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new Error(`RunningHUB 来源图片上传失败 HTTP ${resp.status}`);
  const data = await resp.json();
  const url = data?.data?.download_url || data?.data?.downloadUrl;
  if (!url || ![0, 200].includes(Number(data?.code))) {
    throw new Error('RunningHUB 来源图片上传失败：' + (data?.message || data?.msg || '未返回图片地址'));
  }
  return url;
}

function runningHubFailure(data) {
  const payload = runningHubPayload(data);
  const status = String(payload.status || payload.taskStatus || '').toUpperCase();
  const code = Number(payload.errorCode || payload.code || 0);
  if (['FAILED', 'FAILURE', 'ERROR', 'CANCELLED'].includes(status)) {
    return payload.errorMessage || payload.message || payload.msg || payload.failedReason || '任务执行失败';
  }
  if (code && ![200, 804, 813].includes(code)) {
    return payload.errorMessage || payload.message || payload.msg || `错误码 ${code}`;
  }
  return '';
}

function isRetryableRunningHubQueryError(error) {
  const status = Number(error?.status || 0);
  return status === 429 || status >= 500 || error?.code === 'REQUEST_TIMEOUT' || /^网络请求失败：/.test(error?.message || '');
}

async function queryRunningHubTask({ cfg, taskId }) {
  return postJson(
    runningHubUrl(cfg.baseUrl, 'query'),
    cfg.apiKey,
    { taskId },
    120000
  );
}

export async function generateRunningHubImage({
  cfg,
  prompt,
  ratio,
  size = '',
  sourceDataUrl = '',
  referenceDataUrl = '',
  resolution = '1k',
  pollIntervalMs = 2000,
  maxPolls = 150,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  let imageUrl = '';
  let referenceImageUrl = '';
  if (runningHubNeedsSource(cfg.model)) {
    if (!sourceDataUrl) throw new Error('该 RunningHUB 模型需要来源图片，请先点击网页图片上的魔法按钮');
    imageUrl = await uploadRunningHubImage({ cfg, dataUrl: sourceDataUrl });
    if (referenceDataUrl) referenceImageUrl = await uploadRunningHubImage({ cfg, dataUrl: referenceDataUrl });
  }

  const submit = await postJson(
    runningHubUrl(cfg.baseUrl, cfg.model),
    cfg.apiKey,
    runningHubRequestBody({ model: cfg.model, prompt, ratio, size, imageUrl, referenceImageUrl, resolution }),
    120000
  );
  const submitFailure = runningHubFailure(submit);
  if (submitFailure) throw new Error('RunningHUB 提交失败：' + submitFailure);
  const submitPayload = runningHubPayload(submit);
  const taskId = submitPayload.taskId;
  if (!taskId) throw new Error('RunningHUB 未返回 taskId');

  let resultUrl = extractRunningHubResultUrl(submitPayload.results);
  let lastQueryError = null;
  for (let count = 0; !resultUrl && count < maxPolls; count += 1) {
    if (count > 0 || pollIntervalMs > 0) await wait(pollIntervalMs);
    let query;
    try {
      query = await queryRunningHubTask({ cfg, taskId });
      lastQueryError = null;
    } catch (error) {
      if (!isRetryableRunningHubQueryError(error)) throw error;
      lastQueryError = error;
      continue;
    }
    const failure = runningHubFailure(query);
    if (failure) throw new Error('RunningHUB 生成失败：' + failure);
    resultUrl = extractRunningHubResultUrl(runningHubPayload(query).results || query);
  }
  if (!resultUrl && lastQueryError) {
    throw new Error(`RunningHUB 查询结果暂时失败：${lastQueryError.message}。任务可能仍在平台运行，请稍后到 RunningHUB 查看`);
  }
  if (!resultUrl) throw new Error('RunningHUB 生成超时，请稍后重试');

  try {
    return await imageResultFromUrl(resultUrl, '', { wait });
  } catch (error) {
    throw new Error('下载 RunningHUB 生成图失败：' + (error?.message || error));
  }
}

async function parseGeneratedImage(data) {
  const item = data?.data?.[0];
  if (!item) throw new Error('生图接口未返回图片');
  if (item.b64_json) {
    return imageResultFromBlob(await blobFromDataUrl('data:image/png;base64,' + item.b64_json), item.revised_prompt || '');
  }
  if (item.url) return imageResultFromUrl(item.url, item.revised_prompt || '');
  throw new Error('生图接口返回格式不支持（既无 b64_json 也无 url）');
}

export function agnesImageEditRequestBody({
  model,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  size = '',
  ratio = ''
}) {
  if (!sourceDataUrl) throw new Error('缺少需要编辑的原图');
  const images = [sourceDataUrl, referenceDataUrl].filter(Boolean);
  const body = {
    model,
    prompt,
    extra_body: {
      image: images,
      response_format: 'b64_json'
    }
  };
  if (size) body.size = size;
  if (/^agnes-image-2\.1-flash$/i.test(model || '') && ratio) body.ratio = ratio;
  return body;
}

// Agnes 图生图使用 /images/generations JSON，而不是 OpenAI 的 /images/edits 表单接口。
export async function generateAgnesImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  size = '',
  ratio = ''
}) {
  const data = await postJson(
    joinUrl(cfg.baseUrl, '/images/generations'),
    cfg.apiKey,
    agnesImageEditRequestBody({
      model: cfg.model,
      prompt,
      sourceDataUrl,
      referenceDataUrl,
      size,
      ratio
    }),
    300000
  );
  return parseGeneratedImage(data);
}

export function zenMuxImageEditRequestBody({
  model,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  size = '',
  quality = 'low'
}) {
  if (!sourceDataUrl) throw new Error('缺少需要编辑的原图');
  const body = {
    model,
    prompt,
    images: [sourceDataUrl, referenceDataUrl]
      .filter(Boolean)
      .map((imageUrl) => ({ image_url: imageUrl })),
    n: 1,
    input_fidelity: 'high',
    output_format: 'png',
    quality: normalizedImageQuality(quality)
  };
  if (size) body.size = size;
  return body;
}

export function zenMuxImageEditUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (/(^|\.)zenmux\.ai$/i.test(url.hostname)) {
      return `${url.origin}/api/v1/images/edits`;
    }
  } catch { /* 交给通用 URL 校验处理 */ }
  return joinUrl(baseUrl, '/images/edits');
}

export function zenMuxImageModelCandidates(model) {
  const configured = String(model || '').trim();
  const unprefixed = configured.replace(/^openai\//i, '');
  return [...new Set([unprefixed, configured].filter(Boolean))];
}

async function postZenMuxMultipartEdit({
  url,
  apiKey,
  model,
  prompt,
  sourceDataUrl,
  referenceDataUrl,
  size,
  quality
}) {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('image[]', await blobFromDataUrl(sourceDataUrl), 'source.png');
  if (referenceDataUrl) {
    form.append('image[]', await blobFromDataUrl(referenceDataUrl), 'reference.png');
  }
  form.append('n', '1');
  form.append('input_fidelity', 'high');
  form.append('output_format', 'png');
  form.append('quality', normalizedImageQuality(quality));
  if (size) form.append('size', size);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ctrl.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('ZenMux 图生图请求超时');
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`ZenMux 图生图失败 HTTP ${response.status}${detail ? `：${detail.slice(0, 300)}` : ''}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// ZenMux 的 Data URI 图生图按官方协议使用 JSON images 数组。
export async function generateZenMuxImageEdit({
  cfg,
  prompt,
  sourceDataUrl,
  referenceDataUrl = '',
  size = '',
  quality = 'low'
}) {
  const url = zenMuxImageEditUrl(cfg.baseUrl);
  const models = zenMuxImageModelCandidates(cfg.model);
  let last404;
  for (const model of models) {
    try {
      const data = await postJson(
        url,
        cfg.apiKey,
        zenMuxImageEditRequestBody({ model, prompt, sourceDataUrl, referenceDataUrl, size, quality }),
        300000
      );
      return parseGeneratedImage(data);
    } catch (error) {
      if (error?.status !== 404) throw error;
      last404 = error;
    }
  }
  for (const model of models) {
    try {
      const data = await postZenMuxMultipartEdit({
        url,
        apiKey: cfg.apiKey,
        model,
        prompt,
        sourceDataUrl,
        referenceDataUrl,
        size,
        quality
      });
      return parseGeneratedImage(data);
    } catch (error) {
      if (error?.status !== 404) throw error;
      last404 = error;
    }
  }
  throw new Error(`ZenMux 图生图接口返回 HTTP 404；已尝试模型 ${models.join('、')} 及 JSON/multipart 两种官方格式${last404?.message ? `：${last404.message}` : ''}`);
}

// OpenAI 兼容图像编辑：第一张为待编辑图片，第二张为角色/物品参考图。
export async function generateImageEdit({ cfg, prompt, sourceDataUrl, referenceDataUrl = '', size = '', quality = 'low' }) {
  if (!sourceDataUrl) throw new Error('缺少需要编辑的原图');
  const form = new FormData();
  const sourceBlob = await blobFromDataUrl(sourceDataUrl);
  // OpenAI 兼容接口在接收多张图时要求数组字段。重复使用单值 `image`
  // 会被部分服务端解析器覆盖，最终只留下最后上传的角色/物品参考图。
  const imageField = referenceDataUrl ? 'image[]' : 'image';
  form.append(imageField, sourceBlob, 'source.png');
  if (referenceDataUrl) {
    form.append(imageField, await blobFromDataUrl(referenceDataUrl), 'reference.png');
  }
  form.append('model', cfg.model);
  form.append('prompt', prompt);
  form.append('n', '1');
  if (/gpt-image/i.test(cfg.model || '')) form.append('quality', normalizedImageQuality(quality));
  if (size) form.append('size', size);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000);
  let response;
  try {
    response = await fetch(joinUrl(cfg.baseUrl, '/images/edits'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: ctrl.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('图生图请求超时');
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`图生图失败 HTTP ${response.status}${detail ? `：${detail.slice(0, 300)}` : ''}`);
  }
  return parseGeneratedImage(await response.json());
}

export async function generateRunningHubWorkflowImage({
  cfg,
  prompt,
  ratio,
  size,
  pollIntervalMs = 2000,
  maxPolls = 300,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const workflowId = runningHubWorkflowId(cfg.model);
  if (!workflowId) throw new Error('RunningHUB 工作流模型名应为 workflow/工作流ID');

  const workflowResponse = await postJson(
    runningHubOriginUrl(cfg.baseUrl, 'api/openapi/getJsonApiFormat'),
    cfg.apiKey,
    { apiKey: cfg.apiKey, workflowId },
    120000
  );
  if (Number(workflowResponse?.code) !== 0 || !workflowResponse?.data?.prompt) {
    throw new Error('读取 RunningHUB 工作流节点失败：' + (workflowResponse?.msg || '未返回工作流 JSON'));
  }
  const inputNodes = findRunningHubWorkflowInputNodes(workflowResponse.data.prompt);
  const submit = await postJson(
    runningHubUrl(cfg.baseUrl, `run/workflow/${workflowId}`),
    cfg.apiKey,
    runningHubWorkflowRequestBody({ inputNodes, prompt, ratio, size }),
    120000
  );
  const submitFailure = runningHubFailure(submit);
  if (submitFailure) throw new Error('RunningHUB 工作流提交失败：' + submitFailure);
  const taskId = runningHubPayload(submit).taskId;
  if (!taskId) throw new Error('RunningHUB 工作流未返回 taskId');

  let resultUrl = extractRunningHubResultUrl(runningHubPayload(submit).results);
  let lastQueryError = null;
  for (let count = 0; !resultUrl && count < maxPolls; count += 1) {
    if (count > 0 || pollIntervalMs > 0) await wait(pollIntervalMs);
    let query;
    try {
      query = await queryRunningHubTask({ cfg, taskId });
      lastQueryError = null;
    } catch (error) {
      if (!isRetryableRunningHubQueryError(error)) throw error;
      lastQueryError = error;
      continue;
    }
    const failure = runningHubFailure(query);
    if (failure) throw new Error('RunningHUB 工作流生成失败：' + failure);
    resultUrl = extractRunningHubResultUrl(runningHubPayload(query).results || query);
  }
  if (!resultUrl && lastQueryError) {
    throw new Error(`RunningHUB 工作流查询结果暂时失败：${lastQueryError.message}。任务可能仍在平台运行，请稍后到 RunningHUB 查看`);
  }
  if (!resultUrl) throw new Error('RunningHUB 工作流生成等待超过 10 分钟，请稍后重试');

  try {
    return await runningHubWorkflowResultFromUrl(resultUrl, { wait });
  } catch (error) {
    throw new Error('下载 RunningHUB 工作流生成图失败：' + (error?.message || error));
  }
}

// ---------- 连接测试 ----------

const APIMART_MARKETPLACE_MODELS_URL = 'https://apimart.ai/api/marketplace/models';

async function fetchApiMartMarketplacePage(url, signal) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const resp = await fetch(url, { signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error('请求失败');
}

async function listApiMartMarketplaceType(type, { tags = '', signal } = {}) {
  const models = [];
  const pageSize = 100;
  let page = 1;
  let total = Infinity;
  while (models.length < total && page <= 20) {
    const url = new URL(APIMART_MARKETPLACE_MODELS_URL);
    url.searchParams.set('type', type);
    if (tags) url.searchParams.set('tags', tags);
    url.searchParams.set('sort', 'price_asc');
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    const body = await fetchApiMartMarketplacePage(url.toString(), signal);
    const payload = body?.data && typeof body.data === 'object' ? body.data : body;
    const items = Array.isArray(payload?.models) ? payload.models : [];
    if (body?.success === false || !Array.isArray(payload?.models)) {
      throw new Error(body?.message || '返回格式不正确');
    }
    for (const item of items) {
      const name = typeof item === 'string'
        ? item
        : (item?.model_name || item?.model || item?.id || item?.slug);
      if (name) models.push(String(name));
    }
    total = Number.isFinite(Number(payload?.total)) ? Number(payload.total) : models.length;
    if (items.length < pageSize) break;
    page += 1;
  }
  return [...new Set(models)];
}

async function listApiMartModels() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    // APImart 的公开市场接口在并发请求时偶尔会拒绝其中一个请求，因此顺序
    // 获取并对单页做短重试，避免界面“成功”但只拿到一类模型。
    let visionResult;
    let imageResult;
    try {
      visionResult = { status: 'fulfilled', value: await listApiMartMarketplaceType('chat', { tags: 'Vision', signal: ctrl.signal }) };
    } catch (reason) {
      visionResult = { status: 'rejected', reason };
    }
    try {
      imageResult = { status: 'fulfilled', value: await listApiMartMarketplaceType('image', { signal: ctrl.signal }) };
    } catch (reason) {
      imageResult = { status: 'rejected', reason };
    }
    if (visionResult.status === 'rejected' && imageResult.status === 'rejected') {
      const reason = visionResult.reason?.name === 'AbortError'
        ? '请求超时'
        : (visionResult.reason?.message || imageResult.reason?.message || '未知错误');
      throw new Error(`APImart 获取模型列表失败：${reason}`);
    }
    const visionModels = visionResult.status === 'fulfilled'
      ? visionResult.value
      : PRESETS.apimart.visionModels;
    const imageModels = imageResult.status === 'fulfilled'
      ? imageResult.value
      : PRESETS.apimart.imageModels;
    return [...new Set([...visionModels, ...imageModels])];
  } finally {
    clearTimeout(timer);
  }
}

export async function listOpenRouterModels(cfg) {
  const visionUrl = new URL(joinUrl(cfg.baseUrl, '/models'));
  visionUrl.searchParams.set('input_modalities', 'image');
  visionUrl.searchParams.set('output_modalities', 'text');
  const imageUrl = joinUrl(cfg.baseUrl, '/images/models');
  const [visionResult, imageResult] = await Promise.allSettled([
    requestJson(visionUrl.toString(), cfg.apiKey, { timeoutMs: 20000 }),
    requestJson(imageUrl, cfg.apiKey, { timeoutMs: 20000 })
  ]);
  if (visionResult.status === 'rejected' && imageResult.status === 'rejected') {
    throw new Error(
      `OpenRouter 获取模型失败：${visionResult.reason?.message || imageResult.reason?.message || '未知错误'}`
    );
  }
  const visionModels = visionResult.status === 'fulfilled'
    ? (visionResult.value?.data || [])
      .filter((item) => {
        const input = item?.architecture?.input_modalities;
        const output = item?.architecture?.output_modalities;
        return (!Array.isArray(input) || input.includes('image')) &&
          (!Array.isArray(output) || output.includes('text'));
      })
      .map((item) => item?.id)
      .filter(Boolean)
    : [];
  const imageItems = imageResult.status === 'fulfilled' ? (imageResult.value?.data || []) : [];
  const imageModels = imageItems.map((item) => item?.id).filter(Boolean);
  const imageEditModels = imageItems
    .filter((item) => {
      const descriptor = item?.supported_parameters?.input_references;
      if (!descriptor) return false;
      if (descriptor.type === 'range') return Number(descriptor.max) > 0;
      return true;
    })
    .map((item) => item?.id)
    .filter(Boolean);
  return {
    visionModels: [...new Set(visionModels)].sort(),
    imageModels: [...new Set(imageModels)].sort(),
    imageEditModels: [...new Set(imageEditModels)].sort(),
    models: [...new Set([...visionModels, ...imageModels])].sort()
  };
}

export async function listModels(cfg) {
  if (cfg?.preset === 'apimart') return listApiMartModels();
  if (cfg?.preset === 'openrouter') return (await listOpenRouterModels(cfg)).models;
  if (cfg?.preset === 'runninghub') {
    const preset = PRESETS[cfg.preset];
    return [...new Set([...preset.visionModels, ...preset.imageModels])];
  }
  const url = joinUrl(cfg.baseUrl, '/models');
  const urlError = apiBaseUrlError(url);
  if (urlError) throw new Error(urlError);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: ctrl.signal
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}，请检查 Base URL 与密钥`);
    const data = await resp.json();
    const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    const fetchedModels = [...new Set(
      items.map((item) => typeof item === 'string' ? item : item?.id).filter(Boolean)
    )].sort();
    if (['qianwenai', 'bailian_token_plan'].includes(cfg?.preset)) {
      const preset = PRESETS[cfg.preset];
      return [...new Set([
        ...preset.visionModels,
        ...preset.imageModels,
        ...fetchedModels
      ])];
    }
    return fetchedModels;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('获取模型列表超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function testConnection(cfg) {
  try {
    if (cfg?.preset === 'apimart') {
      const balance = await requestJson(joinUrl(cfg.baseUrl, '/balance'), cfg.apiKey, { timeoutMs: 20000 });
      if (balance?.success !== true) {
        throw new Error(balance?.message || 'APImart API Key 验证失败');
      }
      return { ok: true, message: '连接成功，APImart API Key 有效' };
    }
    if (cfg?.preset === 'bailian_token_plan') {
      const models = await listModels(cfg);
      return {
        ok: true,
        message: `连接成功，获取到 ${models.length} 个 Token Plan 模型`
      };
    }
    if (cfg?.preset === 'qianwenai') {
      const models = await listModels(cfg);
      return {
        ok: true,
        message: `连接成功，获取到 ${models.length} 个 QianwenAI 模型`
      };
    }
    const models = await listModels(cfg);
    return { ok: true, message: `连接成功，获取到 ${models.length} 个模型` };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
