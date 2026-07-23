// API 调用层：图片抓取/归一化、提示词反推（视觉模型）、图片生成（OpenAI 兼容接口）

import { normalizeImageMime } from './image-file.js';
import { PRESETS, apiBaseUrlError } from './settings.js';

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

function reverseLanguageInstruction(language) {
  if (language === 'en') return `Language override: Section B must contain only [SKIP]. Do not provide a Chinese, Japanese, Korean, or other translated explanation. Section C remains the complete English reconstruction prompt.`;
  if (language === 'ja') return `言語指定：セクションBは「B. 日本語完全再現プロンプト」とし、画像の全情報を省略せず自然で実行可能な日本語で記述してください。セクションCは同内容の完全な英語プロンプトにしてください。中国語の解説は出力しないでください。`;
  if (language === 'ko') return `언어 지정: 섹션 B의 제목을 "B. 한국어 전체 재현 프롬프트"로 작성하고, 이미지의 모든 정보를 생략하지 않은 자연스럽고 실행 가능한 한국어로 설명하세요. 섹션 C에는 동일한 내용의 완전한 영어 프롬프트를 작성하세요. 중국어 해설은 출력하지 마세요.`;
  return `语言指定：B 部分必须输出中文完整复刻提示词，C 部分输出信息完全一致的英文完整复刻提示词。`;
}

export async function reversePromptFromImage({ cfg, dataUrl, language = 'zh' }) {
  const url = joinUrl(cfg.baseUrl, '/chat/completions');
  const body = {
    model: cfg.model,
    temperature: 0.2,
    max_tokens: 8000,
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
  const choice = data?.choices?.[0];
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

async function imageResultFromUrl(url, revisedPrompt = '') {
  const response = await fetch(url);
  if (!response.ok) throw new Error('下载生成图失败 HTTP ' + response.status);
  return imageResultFromBlob(await response.blob(), revisedPrompt);
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
  if (/^google\/nano-banana-2-lite\/edit$/i.test(name)) {
    if (!images.length) throw new Error('AtlasCloud 图片编辑缺少来源图片');
    return {
      ...body,
      images,
      aspect_ratio: ratio || 'auto',
      thinking_level: 'default',
      resolution: normalizedImageResolution(resolution)
    };
  }
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
      return imageResultFromUrl(output);
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

export async function generateAtlasCloudImage({ cfg, prompt, size, ratio, quality, resolution, pollIntervalMs, maxPolls, wait }) {
  return runAtlasCloudImageTask({
    cfg,
    body: atlasCloudImageRequestBody({ model: cfg.model, prompt, size, ratio, quality, resolution }),
    pollIntervalMs,
    maxPolls,
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
    wait
  });
}

export async function generateModelScopeImage({
  cfg,
  prompt,
  size,
  pollIntervalMs = 2000,
  maxPolls = 150,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const submittedPrompt = limitModelScopePrompt(prompt);
  const body = { model: normalizeModelScopeModelId(cfg.model), prompt: submittedPrompt };
  if (size) body.size = size;
  const submit = await postJson(
    joinUrl(cfg.baseUrl, '/images/generations'),
    cfg.apiKey,
    body,
    120000,
    { 'X-ModelScope-Async-Mode': 'true' }
  );
  const taskId = submit?.task_id || submit?.taskId;
  if (!taskId) throw new Error('ModelScope 生图接口未返回 task_id');

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
      throw new Error('ModelScope 生图失败：' + modelScopeFailureReason(result));
    }
    if (['SUCCEED', 'SUCCESS', 'COMPLETED'].includes(status)) {
      const output = result?.output_images?.[0];
      const imageUrl = typeof output === 'string' ? output : output?.url;
      if (!imageUrl) throw new Error('ModelScope 任务成功，但未返回 output_images');
      return imageResultFromUrl(imageUrl);
    }
  }
  throw new Error('ModelScope 生图等待超过 5 分钟，请稍后重试');
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
  return !String(model || '').endsWith('/text-to-image');
}

export function runningHubRequestBody({ model, prompt, ratio, imageUrl, referenceImageUrl = '', resolution = '1k' }) {
  const body = {
    prompt,
    aspectRatio: ratio || '1:1',
    resolution: normalizedImageResolution(resolution)
  };
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
    runningHubRequestBody({ model: cfg.model, prompt, ratio, imageUrl, referenceImageUrl, resolution }),
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

  const resp = await fetch(resultUrl);
  if (!resp.ok) throw new Error('下载 RunningHUB 生成图失败 HTTP ' + resp.status);
  const blob = await normalizeImageMime(await resp.blob());
  const bmp = await createImageBitmap(blob);
  const width = bmp.width;
  const height = bmp.height;
  bmp.close?.();
  return {
    dataUrl: await dataUrlFromBlob(blob),
    width,
    height,
    mime: blob.type || 'image/png',
    revisedPrompt: ''
  };
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

  const resp = await fetch(resultUrl);
  if (!resp.ok) throw new Error('下载 RunningHUB 工作流生成图失败 HTTP ' + resp.status);
  const blob = await normalizeImageMime(await resp.blob());
  const bmp = await createImageBitmap(blob);
  const width = bmp.width;
  const height = bmp.height;
  bmp.close?.();
  return {
    dataUrl: await dataUrlFromBlob(blob),
    width,
    height,
    mime: blob.type || 'image/png',
    revisedPrompt: ''
  };
}

// ---------- 连接测试 ----------

export async function listModels(cfg) {
  if (cfg?.preset === 'runninghub') {
    return [...new Set([...PRESETS.runninghub.visionModels, ...PRESETS.runninghub.imageModels])];
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
    return [...new Set(items.map((item) => typeof item === 'string' ? item : item?.id).filter(Boolean))].sort();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('获取模型列表超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function testConnection(cfg) {
  try {
    const models = await listModels(cfg);
    return { ok: true, message: `连接成功，获取到 ${models.length} 个模型` };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
