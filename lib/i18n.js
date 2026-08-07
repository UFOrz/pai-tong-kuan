export const SUPPORTED_LANGUAGES = ['zh', 'en', 'ja', 'ko'];
export const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '自动（浏览器语言）' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' }
];

const EN = {
  'EchoShot · 拍同款': 'EchoShot · 拍同款', '设置 · EchoShot · 拍同款': 'Settings · EchoShot · 拍同款', 'EchoShot · 拍同款 · 设置': 'EchoShot · 拍同款 · Settings',
  '（近似值）': ' (Approx.)',
  '通过此链接注册，插件开发者可能获得平台推广奖励，不影响您的使用价格。您也可以直接访问平台官网注册。': 'If you register through this link, the extension developer may receive a referral reward. This does not affect your price. You may also register directly on the provider’s official website.',
  '部分 Get Key 链接属于平台邀请或推广链接。只有在用户主动点击后才会打开；开发者可能获得平台提供的推广奖励，但不会因此提高用户的使用价格。扩展不会自动跳转、替换网页链接、写入推广 Cookie，也不会跟踪用户是否注册或购买。': 'Some Get Key links are provider invitation or referral links. They open only after the user clicks them. The developer may receive a provider referral reward, but this does not increase the user’s price. The extension does not redirect automatically, replace webpage links, write affiliate cookies, or track whether the user registers or purchases.',
  'EchoShot · 拍同款相册': 'EchoShot · 拍同款 Gallery', '隐私政策 · EchoShot · 拍同款': 'Privacy Policy · EchoShot · 拍同款', 'EchoShot · 拍同款 · Chrome 扩展': 'EchoShot · 拍同款 · Chrome Extension',
  '“EchoShot · 拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '“EchoShot · 拍同款” is a Chrome extension in which users configure their own AI provider API keys. It analyzes images explicitly selected by the user, reconstructs prompts, generates matching images, and manages results locally.',
  '框选截图': 'Capture Area', '隐藏魔法按钮': 'Hide Magic Button', '显示魔法按钮': 'Show Magic Button', '角色与物品': 'Characters & Objects', '平台与模型设置': 'Platforms & Models',
  '开始前，请确认数据使用方式': 'Before you begin, confirm how your data is used',
  '当你点击反推、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': 'When you reverse, generate, replace a subject, or create a set, selected images, references, and prompts are sent to your chosen AI provider for that task.',
  'API Key 仅保存在本机 Chrome 扩展存储中。': 'API keys are stored only in local Chrome extension storage.',
  '来源图、角色/物品素材、提示词和生成结果保存在本机，可随时删除。': 'Source images, character/object assets, prompts, and results are stored locally and can be deleted at any time.',
  '插件不出售数据，也不将数据用于广告或用户画像。': 'The extension does not sell data or use it for ads or profiling.',
  '我已阅读并同意上述数据处理方式': 'I have read and agree to the data handling described above', '同意并继续': 'Agree and Continue', '查看完整隐私政策': 'View Full Privacy Policy',
  '还没有选择图片': 'No image selected', '浏览网页时，把鼠标悬停在图片上，点击右上角出现的魔法按钮，即可反推提示词并生成同款图片。': 'Hover over an image and click the magic button to reconstruct its prompt and create a matching image.',
  '也可以在图片上点右键，选择「✨ 反推提示词并生成同款」。': 'You can also right-click an image and choose “✨ Reverse prompt and create matching image”.',
  '📷 框选区域截图': '📷 Capture an Area', '打开相册': 'Open Gallery', '来源图片': 'Source Image', '正在获取图片…': 'Loading image…',
  '提示词': 'Prompt', '重新反推': 'Reverse Again', '复制': 'Copy', '正在反推提示词…': 'Reconstructing prompt…', '✓ 反推成功，可直接编辑提示词': '✓ Prompt ready — you can edit it',
  '反推': 'Reverse', '生成设置': 'Generation Settings', '比例': 'Aspect Ratio', '生图': 'Image Model', '✨ 生成图片': '✨ Generate Image',
  '替换角色/物品': 'Replace Character/Object', '正在生成，通常需要 10–60 秒…': 'Generating, usually 10–60 seconds…', '✓ 生成成功': '✓ Generated',
  '替换角色或者物品': 'Replace Character or Object', '管理素材': 'Manage Assets', '保持构图、背景和光影基本不变，只替换目标人物、角色或物品。请选择支持图生图/edit 的模型。': 'Keep composition, background, and lighting unchanged while replacing only the target character or object. Choose an image-edit model.',
  '替换类型': 'Replacement Type', '人物或角色': 'Person or Character', '物品': 'Object', '服装或穿搭': 'Clothing or Outfit',
  '✨ 开始替换': '✨ Start Replacement', '正在替换角色或者物品…': 'Replacing character or object…', '✓ 替换成功，已保存到相册': '✓ Replacement saved to gallery',
  '主体一致组图': 'Consistent Image Set', '同款结果': 'Result', '下载': 'Download', '重新生成': 'Generate Again', '查看相册': 'View Gallery', '✓ 已自动保存到相册': '✓ Saved to gallery',
  '角色与物品库': 'Character & Object Library', '素材只保存在本机': 'Assets are stored locally only', '＋ 添加角色或物品': '＋ Add Character or Object', '关闭': 'Close', '关闭素材大图': 'Close asset preview',
  '正在读取图片': 'Reading image', '切换并保存为默认反推模型': 'Switch and save as default vision model', '反推得到的提示词会显示在这里，可以直接编辑': 'The reconstructed prompt will appear here and can be edited', '切换并保存为默认生图模型': 'Switch and save as default image model',
  '替换角色或者物品提示词': 'Character or object replacement prompt', '在相册中查看大图': 'View full image in gallery', '在相册中查看这张生成图片的大图': 'View this generated image in the gallery',
  '平台与模型管理': 'Platform & Model Management', '查看隐私政策': 'View Privacy Policy', '① 平台管理': '① Platforms', '接口，也可以手动添加模型。': 'endpoint and manual model entry are supported.',
  '自定义接口': 'Custom API', '＋ 添加接口': '＋ Add API', '平台列表': 'Platforms', '② 默认模型': '② Default Models', '默认反推': 'Default Vision Model', '默认生图': 'Default Image Model',
  '③ 比例与尺寸': '③ Ratios & Sizes', '默认比例': 'Default Ratio', '图像质量': 'Image Quality', '适用于 GPT Image 等支持 Quality 的模型': 'For models that support Quality, such as GPT Image', 'Low（默认）': 'Low (Default)',
  '分辨率档位': 'Resolution Tier', '适用于支持 1k / 2k / 4k 的模型': 'For models supporting 1K / 2K / 4K', '1K（默认）': '1K (Default)', '保存设置': 'Save Settings', '✓ 已保存': '✓ Saved', '隐私政策': 'Privacy Policy', '选择接口模板': 'Choose API Template',
  '全选': 'Select All', '删除': 'Delete', '设置': 'Settings', '已选': 'Selected', '张': 'items', '上一页': 'Previous', '下一页': 'Next', '相册还是空的': 'Your gallery is empty',
  '在网页图片上悬停并点击魔法按钮，生成同款图片后会自动保存到这里。': 'Hover over a web image and click the magic button. Generated images are saved here automatically.',
  '原图': 'Original', '同款图片': 'Generated', '准备对比…': 'Preparing comparison…', '＋ 添加到角色库': '＋ Add to Library', '添加到角色库': 'Add to Character Library', '复制提示词': 'Copy Prompt', '反推原文': 'Original Reverse Prompt',
  '生成平台': 'Provider', '生成模型': 'Model', '尺寸': 'Size', '生成时间': 'Created', '查看原图': 'View Original', '来源页面': 'Source Page', '访问页面': 'Open Page',
  '✨ 再拍一张': '✨ Generate Another', '👤 替换角色': '👤 Replace Character', '替换角色': 'Replace Character', '生成组图': 'Generate Set', '确认删除': 'Confirm Deletion', '取消': 'Cancel',
  '搜索提示词 / 中文解读 / 模型…': 'Search prompt / model…', '相册分页': 'Gallery pages', '选择页码': 'Choose page', '上一张': 'Previous image', '下一张': 'Next image', '关闭大图': 'Close preview', '组图数量': 'Number of images',
  '中文解读': 'Explanation', '日语解读': 'Japanese Explanation', '韩语解读': 'Korean Explanation',
  '界面语言': 'Interface Language', '自动（浏览器语言）': 'Auto (Browser Language)',
  '共 {count} 张': '{count} items', '组图 {index}/{count}': 'Set {index}/{count}', '第 {page} 页，共 {total} 页': 'Page {page} of {total}', '搜索结果，第 {page} 页，共 {total} 页': 'Search results, page {page} of {total}',
  '(无提示词)': '(No prompt)', '取消全选': 'Deselect All', '选择': 'Select', '{width} × {height} 像素': '{width} × {height} px',
  '未找到匹配作品': 'No matching images', '可以尝试搜索其他提示词、中文解读、模型或平台名称。': 'Try another prompt, model, or provider name.',
  '可以直接编辑提示词': 'You can edit the prompt', '未启用反推模型': 'No vision model enabled', '未启用生图模型': 'No image model enabled', '尚未启用生图模型': 'No image model enabled', '默认生图': 'Default image model',
  '已设为默认反推模型': 'Default vision model updated', '已设为默认生图模型': 'Default image model updated', '请先反推或输入提示词': 'Reconstruct or enter a prompt first',
  '正在反推提示词，已等待 {seconds} 秒…': 'Reconstructing prompt — {seconds}s elapsed…', '正在生成，已等待 {seconds} 秒…': 'Generating — {seconds}s elapsed…', '正在生成组图，已等待 {seconds} 秒…': 'Generating image set — {seconds}s elapsed…', '已等待 {seconds} 秒…': '{seconds}s elapsed…',
  '请在网页中拖动框选截图区域，按 Esc 可取消': 'Drag on the page to select a capture area. Press Esc to cancel.', '在相册中查看组图第 {index} 张，共 {count} 张': 'View image {index} of {count} in the gallery', '点击在相册中查看大图': 'Click to view full image in gallery', '组图第 {index} 张，共 {count} 张': 'Image {index} of {count}', '提示词已复制': 'Prompt copied',
  '魔法按钮已显示，点击隐藏': 'Magic button is visible; click to hide', '魔法按钮已隐藏，点击显示': 'Magic button is hidden; click to show',
  '新平台': 'New Platform', '尚未获取模型，可自动获取或手动添加。': 'No models yet. Fetch automatically or add one manually.', '未启用的模型已隐藏，可打开上方开关查看。': 'Disabled models are hidden. Turn on the switch above to view them.', '移除模型': 'Remove model', '未命名平台': 'Unnamed Platform', '已添加接口': 'Added APIs', '删除平台': 'Delete Platform', '平台名称': 'Platform Name', '显示': 'Show', '隐藏': 'Hide', '自动获取模型': 'Fetch Models', '手动输入模型名称': 'Enter model name manually', '添加': 'Add', '模型名称与启用能力': 'Models & Capabilities', '显示未启用模型': 'Show disabled models', '反推': 'Vision', '生图': 'Image', '尚未启用模型': 'No model enabled',
  '✨ 反推提示词并生成同款': '✨ Reconstruct Prompt and Generate', '🖼 打开 EchoShot · 拍同款相册': '🖼 Open EchoShot · 拍同款 Gallery',
  '无法对比': 'Comparison unavailable', '无原图': 'No original', '开启对比': 'Enable Comparison', '关闭对比': 'Disable Comparison', '✓ 已在角色库': '✓ Already in Library', '已在角色库': 'Already in Character Library', '正在添加…': 'Adding…', '正在添加到角色库…': 'Adding to Character Library…', '这张图片已经在角色与物品库中': 'This image is already in the character and object library', '已添加到角色与物品库': 'Added to the character and object library', '确定删除这张图片吗？此操作不可恢复。': 'Delete this image? This action cannot be undone.', '已删除': 'Deleted',
  '2 张': '2 images', '4 张': '4 images', '6 张': '6 images', '8 张': '8 images', '上一张（←）': 'Previous (←)', '下一张（→）': 'Next (→)',
  '反 {count}': 'Vision {count}', '图 {count}': 'Image {count}', '正在获取…': 'Fetching…', '获取中…': 'Fetching…', '已获取 {total} 个，新增 {added} 个': 'Fetched {total}; added {added}', '再次点击删除': 'Click again to delete',
  '每个平台独立保存 API 地址和密钥。密钥仅保存在本机浏览器中；执行反推或生图时，所选图片和提示词会发送到你选择的 AI 平台。': 'Each platform stores its API address and key separately. Keys stay in this browser; selected images and prompts are sent to the chosen AI platform only when running a task.',
  '支持 OpenAI 兼容的': 'Supports OpenAI-compatible', '侧边栏切换模型会自动保存；在这里修改后，请点击“保存设置”。后续任务都会使用新的默认值。': 'Model changes in the side panel are saved automatically. Changes made here take effect after you click “Save Settings”.', '比例会映射为生图接口的 size 参数，请按所选模型支持的尺寸填写。': 'Ratios map to the image API size parameter. Enter sizes supported by the selected model.', '插件会根据模型协议提交对应选项；不支持 Quality 或分辨率档位的模型仍使用上方像素尺寸。': 'The extension sends supported quality options according to each model protocol; other models use the pixel sizes above.',
  '“拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '“Match This” is a Chrome extension in which users configure their own AI provider API keys. It analyzes images explicitly selected by the user, reconstructs prompts, generates matching images, and manages results locally.',
  'API 配置：': 'API configuration:', '平台名称、Base URL、模型名称及用户填写的 API Key。': 'Platform name, Base URL, model name, and the API key entered by the user.', '主动选择的内容：': 'User-selected content:', '网页图片、用户主动框选截取的当前可见页面区域、图片地址、所在页面 URL 和页面标题。': 'Web images, visible page regions explicitly captured by the user, image URLs, page URLs, and page titles.', '替换参考素材：': 'Replacement references:', '用户添加到本机角色与物品库中的图片和名称。': 'Images and names added by the user to the local character and object library.', '用户生成内容：': 'User-generated content:', '反推提示词、用户编辑后的提示词、生成图片及生成参数。': 'Reconstructed prompts, user-edited prompts, generated images, and generation parameters.', '本地任务状态：': 'Local task state:', '当前任务、模型选择、相册记录和界面设置。': 'Current tasks, model selections, gallery records, and interface settings.',
  '扩展不收集姓名、邮箱、通讯录、精确位置、支付卡信息，也不创建跨网站用户画像。': 'The extension does not collect names, email addresses, contacts, precise location, or payment card information, and does not create cross-site profiles.',
  '只有当用户点击反推、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。': 'Only when the user starts a reverse, generation, replacement, or image-set task does the extension send the source images, references, and prompts required for that task to the selected AI provider.', 'API Key 仅用于向该平台鉴权。扩展开发者不运营中转服务器，也不会接收用户的 API Key、图片或提示词。': 'API keys are used only to authenticate with the selected provider. The developer operates no relay server and does not receive users’ API keys, images, or prompts.', '内置平台包括 OpenAI、ModelScope、SiliconFlow、Agnes-AI、ZenMux、RunningHUB、AtlasCloud、APImart、OpenRouter、QianwenAI 和 Aliyun Token Plan；用户也可以配置自己的兼容服务。': 'Built-in platforms include OpenAI, ModelScope, SiliconFlow, Agnes-AI, ZenMux, RunningHUB, AtlasCloud, APImart, OpenRouter, QianwenAI, and Aliyun Token Plan. Users may also configure compatible services.', '第三方平台如何保存和处理请求，由相应平台的隐私政策及用户与该平台之间的协议决定。': 'How third-party platforms retain and process requests is governed by their privacy policies and the user’s agreement with them.', '除完成用户明确请求的反推、生图，或法律、安全所必需的情形外，扩展不会向其他第三方传输数据。': 'The extension does not transfer data to other third parties except to fulfill explicit user requests or where required by law or security.',
  'API 配置保存在': 'API configuration is stored in', '，并限制为扩展可信页面和后台访问。': 'and is restricted to trusted extension pages and background access.', '当前任务临时保存在': 'Current tasks are temporarily stored in', '。': '.', '来源图、角色/物品参考素材、提示词和生成图片保存在本机 IndexedDB 中。': 'Source images, character/object references, prompts, and generated images are stored in local IndexedDB.', '用户可以删除 API Key、参考素材和相册作品；卸载扩展会清除 Chrome 管理的扩展本地数据。': 'Users can delete API keys, reference assets, and gallery items. Uninstalling the extension clears extension-local data managed by Chrome.',
  '预设 AI 平台均使用 HTTPS。': 'Preset AI platforms use HTTPS.', '自定义 API Base URL 必须使用 HTTPS；仅本机 localhost 调试允许 HTTP。': 'Custom API Base URLs must use HTTPS; HTTP is allowed only for local localhost development.', '扩展不加载或执行远程 JavaScript，全部运行逻辑均包含在安装包中。': 'The extension does not load or execute remote JavaScript; all runtime logic is included in the package.',
  '扩展不会出售用户数据，不会将用户数据用于个性化广告、再营销、信用评估或数据经纪，也不会允许开发者或其他人员读取用户内容；法律义务或用户明确请求的支持情形除外。': 'The extension does not sell user data or use it for personalized ads, remarketing, credit assessment, or data brokerage, and does not allow the developer or others to read user content except where legally required or explicitly requested for support.', '扩展对用户数据的使用遵守 Chrome Web Store User Data Policy，包括 Limited Use 要求。': 'Use of user data complies with the Chrome Web Store User Data Policy, including Limited Use requirements.', '扩展并非专门面向儿童，也不会有意收集儿童个人信息。': 'The extension is not directed at children and does not intentionally collect children’s personal information.', '如数据处理方式发生实质变化，扩展会在实施前通过产品界面提示，并在需要时重新征得同意。有关隐私的问题，可通过 Chrome Web Store 商品页面的“支持”入口联系发布者。': 'If data handling changes materially, the extension will notify users before implementation and request consent again where required. For privacy questions, contact the publisher through the Support link on the Chrome Web Store listing.',
  '隐私政策': 'Privacy Policy', '更新日期：2026 年 7 月 22 日': 'Updated: July 22, 2026', '处理的数据': 'Data We Process', '数据用途与共享': 'How Data Is Used and Shared', '本地保存与删除': 'Local Storage and Deletion', '数据安全': 'Data Security', '广告、出售与 Limited Use': 'Advertising, Sale, and Limited Use', '儿童隐私': 'Children’s Privacy', '政策变更与联系': 'Policy Changes and Contact'
};

const JA = {
  ...EN,
  'EchoShot · 拍同款': 'EchoShot · 拍同款', '设置 · EchoShot · 拍同款': '設定 · EchoShot · 拍同款', 'EchoShot · 拍同款 · 设置': 'EchoShot · 拍同款 · 設定', 'EchoShot · 拍同款相册': 'EchoShot · 拍同款 アルバム', '隐私政策 · EchoShot · 拍同款': 'プライバシーポリシー · EchoShot · 拍同款', 'EchoShot · 拍同款 · Chrome 扩展': 'EchoShot · 拍同款 · Chrome 拡張機能',
  '“EchoShot · 拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '「EchoShot · 拍同款」は、ユーザー自身がAIサービスのAPIキーを設定し、明示的に選択したウェブ画像の解析、再現プロンプトと類似画像の生成、生成履歴のローカル管理を行うChrome拡張機能です。',
  '（近似值）': '（近似値）',
  '通过此链接注册，插件开发者可能获得平台推广奖励，不影响您的使用价格。您也可以直接访问平台官网注册。': 'このリンクから登録すると、拡張機能の開発者が紹介報酬を受け取る場合があります。利用料金には影響しません。各サービスの公式サイトから直接登録することもできます。',
  '部分 Get Key 链接属于平台邀请或推广链接。只有在用户主动点击后才会打开；开发者可能获得平台提供的推广奖励，但不会因此提高用户的使用价格。扩展不会自动跳转、替换网页链接、写入推广 Cookie，也不会跟踪用户是否注册或购买。': '一部のGet Keyリンクは招待・紹介リンクです。ユーザーが明示的にクリックした場合にのみ開きます。開発者が紹介報酬を受け取る場合がありますが、利用料金が上がることはありません。自動転送、ウェブページのリンク置換、紹介Cookieの書き込み、登録・購入状況の追跡は行いません。',
  '框选截图': '範囲をキャプチャ', '隐藏魔法按钮': 'マジックボタンを非表示', '显示魔法按钮': 'マジックボタンを表示', '角色与物品': '人物とアイテム', '平台与模型设置': 'プラットフォームとモデル',
  '开始前，请确认数据使用方式': '開始前にデータの利用方法をご確認ください', '我已阅读并同意上述数据处理方式': '上記のデータ処理を確認し、同意します', '同意并继续': '同意して続行', '查看完整隐私政策': 'プライバシーポリシー全文を見る',
  '还没有选择图片': '画像が選択されていません', '📷 框选区域截图': '📷 範囲をキャプチャ', '打开相册': 'アルバムを開く', '来源图片': '元画像', '正在获取图片…': '画像を読み込み中…',
  '提示词': 'プロンプト', '重新反推': '再解析', '复制': 'コピー', '正在反推提示词…': 'プロンプトを解析中…', '✓ 反推成功，可直接编辑提示词': '✓ 解析完了・編集できます', '反推': '解析モデル',
  '生成设置': '生成設定', '比例': 'アスペクト比', '生图': '画像モデル', '✨ 生成图片': '✨ 画像を生成', '替换角色/物品': '人物/アイテムを置換', '✓ 生成成功': '✓ 生成完了',
  '替换角色或者物品': '人物またはアイテムを置換', '管理素材': '素材を管理', '替换类型': '置換タイプ', '人物或角色': '人物またはキャラクター', '物品': 'アイテム', '服装或穿搭': '服装またはコーデ', '✨ 开始替换': '✨ 置換を開始', '正在替换角色或者物品…': '人物またはアイテムを置換中…', '✓ 替换成功，已保存到相册': '✓ 置換結果をアルバムに保存しました',
  '主体一致组图': '主体を統一した画像セット', '同款结果': '生成結果', '下载': 'ダウンロード', '重新生成': '再生成', '查看相册': 'アルバムを見る', '✓ 已自动保存到相册': '✓ アルバムに自動保存しました',
  '角色与物品库': '人物・アイテムライブラリ', '素材只保存在本机': '素材は端末内にのみ保存されます', '＋ 添加角色或物品': '＋ 人物またはアイテムを追加', '关闭': '閉じる', '在相册中查看大图': 'アルバムで拡大表示',
  '平台与模型管理': 'プラットフォームとモデル管理', '查看隐私政策': 'プライバシーポリシーを見る', '① 平台管理': '① プラットフォーム管理', '自定义接口': 'カスタム API', '＋ 添加接口': '＋ API を追加', '平台列表': 'プラットフォーム',
  '② 默认模型': '② デフォルトモデル', '默认反推': 'デフォルト解析モデル', '默认生图': 'デフォルト画像モデル', '③ 比例与尺寸': '③ 比率とサイズ', '默认比例': 'デフォルト比率', '图像质量': '画像品質', '分辨率档位': '解像度', '保存设置': '設定を保存', '✓ 已保存': '✓ 保存しました', '隐私政策': 'プライバシーポリシー',
  '全选': 'すべて選択', '删除': '削除', '设置': '設定', '已选': '選択済み', '张': '件', '上一页': '前へ', '下一页': '次へ', '相册还是空的': 'アルバムは空です', '原图': '元画像', '同款图片': '生成画像', '准备对比…': '比較を準備中…',
  '＋ 添加到角色库': '＋ ライブラリに追加', '添加到角色库': '人物・アイテムライブラリに追加', '复制提示词': 'プロンプトをコピー', '反推原文': '解析元プロンプト', '生成平台': '生成サービス', '生成模型': '生成モデル', '尺寸': 'サイズ', '生成时间': '生成日時', '查看原图': '元画像を見る', '来源页面': '元ページ', '访问页面': 'ページを開く',
  '✨ 再拍一张': '✨ もう1枚生成', '👤 替换角色': '👤 人物を置換', '替换角色': '人物を置換', '生成组图': '画像セットを生成', '确认删除': '削除の確認', '取消': 'キャンセル', '搜索提示词 / 中文解读 / 模型…': 'プロンプト / 日本語解説 / モデルを検索…', '上一张': '前の画像', '下一张': '次の画像', '日语解读': '日本語解説', '中文解读': '日本語解説',
  '界面语言': '表示言語', '自动（浏览器语言）': '自動（ブラウザの言語）', '更新日期：2026 年 7 月 21 日': '更新日：2026年7月21日', '处理的数据': '処理するデータ', '数据用途与共享': 'データの利用と共有', '本地保存与删除': 'ローカル保存と削除', '数据安全': 'データセキュリティ', '儿童隐私': '子どものプライバシー', '政策变更与联系': 'ポリシーの変更とお問い合わせ'
  , '共 {count} 张': '全{count}件', '组图 {index}/{count}': 'セット {index}/{count}', '第 {page} 页，共 {total} 页': '{total}ページ中{page}ページ', '搜索结果，第 {page} 页，共 {total} 页': '検索結果、{total}ページ中{page}ページ', '(无提示词)': '（プロンプトなし）', '取消全选': '選択を解除', '选择': '選択', '{width} × {height} 像素': '{width} × {height} ピクセル', '未找到匹配作品': '一致する作品がありません', '可以尝试搜索其他提示词、中文解读、模型或平台名称。': '別のプロンプト、日本語解説、モデル、またはサービス名で検索してください。'
  , '当你点击反推、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': '解析、生成、人物置換、画像セット生成を実行すると、選択した元画像、参照素材、プロンプトがタスク処理のため選択したAIサービスへ送信されます。', 'API Key 仅保存在本机 Chrome 扩展存储中。': 'APIキーはこの端末のChrome拡張機能ストレージにのみ保存されます。', '来源图、角色/物品素材、提示词和生成结果保存在本机，可随时删除。': '元画像、人物・アイテム素材、プロンプト、生成結果は端末内に保存され、いつでも削除できます。', '插件不出售数据，也不将数据用于广告或用户画像。': '本拡張機能はデータを販売せず、広告やプロファイリングにも使用しません。'
  , '可以直接编辑提示词': 'プロンプトを編集できます', '未启用反推模型': '解析モデルが有効になっていません', '未启用生图模型': '画像モデルが有効になっていません', '尚未启用生图模型': '画像モデルが有効になっていません', '默认生图': 'デフォルト画像モデル', '已设为默认反推模型': 'デフォルト解析モデルを更新しました', '已设为默认生图模型': 'デフォルト画像モデルを更新しました', '请先反推或输入提示词': '先にプロンプトを解析または入力してください', '正在反推提示词，已等待 {seconds} 秒…': 'プロンプトを解析中 · {seconds}秒経過…', '正在生成，已等待 {seconds} 秒…': '生成中 · {seconds}秒経過…', '正在生成组图，已等待 {seconds} 秒…': '画像セットを生成中 · {seconds}秒経過…', '已等待 {seconds} 秒…': '{seconds}秒経過…', '请在网页中拖动框选截图区域，按 Esc 可取消': 'ページ上をドラッグしてキャプチャ範囲を選択してください。Escでキャンセルできます。', '在相册中查看组图第 {index} 张，共 {count} 张': 'アルバムで{count}枚中{index}枚目を表示', '点击在相册中查看大图': 'クリックしてアルバムで拡大表示', '组图第 {index} 张，共 {count} 张': '{count}枚中{index}枚目', '提示词已复制': 'プロンプトをコピーしました', '魔法按钮已显示，点击隐藏': 'マジックボタンは表示中です。クリックで非表示', '魔法按钮已隐藏，点击显示': 'マジックボタンは非表示です。クリックで表示'
  , '新平台': '新しいプラットフォーム', '尚未获取模型，可自动获取或手动添加。': 'モデルがありません。自動取得または手動追加してください。', '未启用的模型已隐藏，可打开上方开关查看。': '無効なモデルは非表示です。上のスイッチで表示できます。', '移除模型': 'モデルを削除', '未命名平台': '名称未設定', '已添加接口': '追加済みAPI', '删除平台': 'プラットフォームを削除', '平台名称': 'プラットフォーム名', '显示': '表示', '隐藏': '非表示', '自动获取模型': 'モデルを自動取得', '手动输入模型名称': 'モデル名を手動入力', '添加': '追加', '模型名称与启用能力': 'モデルと機能', '显示未启用模型': '無効なモデルを表示', '尚未启用模型': '有効なモデルなし'
  , '✨ 反推提示词并生成同款': '✨ プロンプトを解析して生成', '🖼 打开 EchoShot · 拍同款相册': '🖼 EchoShot · 拍同款 アルバムを開く'
  , '无法对比': '比較できません', '无原图': '元画像なし', '开启对比': '比較を有効化', '关闭对比': '比較を無効化', '✓ 已在角色库': '✓ ライブラリに追加済み', '已在角色库': '人物・アイテムライブラリに追加済み', '正在添加…': '追加中…', '正在添加到角色库…': '人物・アイテムライブラリに追加中…', '这张图片已经在角色与物品库中': 'この画像は人物・アイテムライブラリに追加済みです', '已添加到角色与物品库': '人物・アイテムライブラリに追加しました', '确定删除这张图片吗？此操作不可恢复。': 'この画像を削除しますか？元に戻せません。', '已删除': '削除しました'
  , '2 张': '2枚', '4 张': '4枚', '6 张': '6枚', '8 张': '8枚', '上一张（←）': '前の画像（←）', '下一张（→）': '次の画像（→）'
  , '反 {count}': '解析 {count}', '图 {count}': '画像 {count}', '正在获取…': '取得中…', '获取中…': '取得中…', '已获取 {total} 个，新增 {added} 个': '{total}件取得、{added}件追加', '再次点击删除': 'もう一度クリックして削除'
  , '浏览网页时，把鼠标悬停在图片上，点击右上角出现的魔法按钮，即可反推提示词并生成同款图片。': 'ウェブ画像にカーソルを合わせ、右上のマジックボタンをクリックすると、プロンプトを解析して同じ雰囲気の画像を生成できます。', '也可以在图片上点右键，选择「✨ 反推提示词并生成同款」。': '画像を右クリックして「✨ プロンプトを解析して生成」を選ぶこともできます。', '保持构图、背景和光影基本不变，只替换目标人物、角色或物品。请选择支持图生图/edit 的模型。': '構図、背景、光を保ったまま対象の人物またはアイテムだけを置換します。画像編集対応モデルを選択してください。', '正在生成，通常需要 10–60 秒…': '生成中です。通常10〜60秒かかります…', '反推得到的提示词会显示在这里，可以直接编辑': '解析したプロンプトがここに表示され、直接編集できます', '切换并保存为默认反推模型': '切り替えてデフォルト解析モデルとして保存', '切换并保存为默认生图模型': '切り替えてデフォルト画像モデルとして保存'
  , '每个平台独立保存 API 地址和密钥。密钥仅保存在本机浏览器中；执行反推或生图时，所选图片和提示词会发送到你选择的 AI 平台。': '各プラットフォームのAPIアドレスとキーは個別に保存されます。キーはこのブラウザ内にのみ保存され、タスク実行時だけ選択した画像とプロンプトが選択先のAIサービスへ送信されます。', '支持 OpenAI 兼容的': 'OpenAI互換の', '侧边栏切换模型会自动保存；在这里修改后，请点击“保存设置”。后续任务都会使用新的默认值。': 'サイドパネルでのモデル変更は自動保存されます。ここで変更した場合は「設定を保存」をクリックしてください。', '比例会映射为生图接口的 size 参数，请按所选模型支持的尺寸填写。': '比率は画像APIのsizeパラメータに対応します。選択モデルが対応するサイズを入力してください。', '插件会根据模型协议提交对应选项；不支持 Quality 或分辨率档位的模型仍使用上方像素尺寸。': 'モデルの仕様に応じて品質設定を送信します。未対応モデルでは上記のピクセルサイズを使用します。'
  , '“拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '「同じ画像を作る」は、ユーザー自身がAIサービスのAPIキーを設定し、明示的に選択したウェブ画像の解析、再現プロンプトと類似画像の生成、生成履歴のローカル管理を行うChrome拡張機能です。', 'API 配置：': 'API設定：', '平台名称、Base URL、模型名称及用户填写的 API Key。': 'プラットフォーム名、Base URL、モデル名、ユーザーが入力したAPIキー。', '主动选择的内容：': 'ユーザーが選択した内容：', '网页图片、用户主动框选截取的当前可见页面区域、图片地址、所在页面 URL 和页面标题。': 'ウェブ画像、ユーザーが範囲指定した表示中のページ領域、画像URL、ページURL、ページタイトル。', '替换参考素材：': '置換用の参照素材：', '用户添加到本机角色与物品库中的图片和名称。': 'ローカルの人物・アイテムライブラリに追加した画像と名称。', '用户生成内容：': 'ユーザー生成コンテンツ：', '反推提示词、用户编辑后的提示词、生成图片及生成参数。': '解析プロンプト、編集済みプロンプト、生成画像、生成パラメータ。', '本地任务状态：': 'ローカルタスク状態：', '当前任务、模型选择、相册记录和界面设置。': '現在のタスク、モデル選択、アルバム記録、画面設定。', '扩展不收集姓名、邮箱、通讯录、精确位置、支付卡信息，也不创建跨网站用户画像。': '氏名、メールアドレス、連絡先、正確な位置情報、決済カード情報は収集せず、サイト横断プロファイルも作成しません。'
  , '只有当用户点击反推、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。': 'ユーザーが解析、生成、人物置換、画像セット生成を開始した場合に限り、タスクに必要な元画像、参照素材、プロンプトを選択したAIサービスへ送信します。', 'API Key 仅用于向该平台鉴权。扩展开发者不运营中转服务器，也不会接收用户的 API Key、图片或提示词。': 'APIキーは選択先サービスの認証にのみ使用されます。開発者は中継サーバーを運営せず、APIキー、画像、プロンプトを受信しません。', '内置平台包括 OpenAI、ModelScope、SiliconFlow、Agnes-AI、ZenMux、RunningHUB、AtlasCloud、APImart、OpenRouter、QianwenAI 和 Aliyun Token Plan；用户也可以配置自己的兼容服务。': '内蔵サービスはOpenAI、ModelScope、SiliconFlow、Agnes-AI、ZenMux、RunningHUB、AtlasCloud、APImart、OpenRouter、QianwenAI、Aliyun Token Planです。互換サービスも設定できます。', '第三方平台如何保存和处理请求，由相应平台的隐私政策及用户与该平台之间的协议决定。': '第三者サービスによるリクエストの保存と処理は、各サービスのプライバシーポリシーとユーザー契約に従います。', '除完成用户明确请求的反推、生图，或法律、安全所必需的情形外，扩展不会向其他第三方传输数据。': '明示されたタスクの実行、法令または安全上必要な場合を除き、他の第三者へデータを送信しません。'
  , 'API 配置保存在': 'API設定は', '，并限制为扩展可信页面和后台访问。': 'に保存され、信頼済みの拡張ページとバックグラウンドからのみアクセスできます。', '当前任务临时保存在': '現在のタスクは一時的に', '。': '。', '来源图、角色/物品参考素材、提示词和生成图片保存在本机 IndexedDB 中。': '元画像、人物・アイテム参照、プロンプト、生成画像はローカルIndexedDBに保存されます。', '用户可以删除 API Key、参考素材和相册作品；卸载扩展会清除 Chrome 管理的扩展本地数据。': 'APIキー、参照素材、アルバム作品は削除できます。拡張機能をアンインストールするとChrome管理のローカルデータも削除されます。', '预设 AI 平台均使用 HTTPS。': 'プリセットAIサービスはHTTPSを使用します。', '自定义 API Base URL 必须使用 HTTPS；仅本机 localhost 调试允许 HTTP。': 'カスタムAPI Base URLはHTTPS必須です。HTTPはlocalhostでの開発時のみ許可されます。', '扩展不加载或执行远程 JavaScript，全部运行逻辑均包含在安装包中。': 'リモートJavaScriptを読み込み・実行せず、すべてのロジックはインストールパッケージに含まれます。', '扩展不会出售用户数据，不会将用户数据用于个性化广告、再营销、信用评估或数据经纪，也不会允许开发者或其他人员读取用户内容；法律义务或用户明确请求的支持情形除外。': 'ユーザーデータを販売せず、パーソナライズ広告、リマーケティング、信用評価、データ仲介に使用しません。法的義務またはユーザーが明示的に依頼したサポートを除き、開発者その他の者が内容を読むこともありません。', '扩展对用户数据的使用遵守 Chrome Web Store User Data Policy，包括 Limited Use 要求。': 'ユーザーデータの利用はLimited Use要件を含むChrome Web Store User Data Policyに準拠します。', '扩展并非专门面向儿童，也不会有意收集儿童个人信息。': '子ども向けの拡張機能ではなく、子どもの個人情報を意図的に収集しません。', '如数据处理方式发生实质变化，扩展会在实施前通过产品界面提示，并在需要时重新征得同意。有关隐私的问题，可通过 Chrome Web Store 商品页面的“支持”入口联系发布者。': 'データ処理が大きく変わる場合は実施前に画面で通知し、必要に応じて再同意を求めます。プライバシーに関するお問い合わせはChrome Web Store掲載ページのサポート窓口から行えます。'
};

const KO = {
  ...EN,
  'EchoShot · 拍同款': 'EchoShot · 拍同款', '设置 · EchoShot · 拍同款': '설정 · EchoShot · 拍同款', 'EchoShot · 拍同款 · 设置': 'EchoShot · 拍同款 · 설정', 'EchoShot · 拍同款相册': 'EchoShot · 拍同款 앨범', '隐私政策 · EchoShot · 拍同款': '개인정보 처리방침 · EchoShot · 拍同款', 'EchoShot · 拍同款 · Chrome 扩展': 'EchoShot · 拍同款 · Chrome 확장 프로그램',
  '“EchoShot · 拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '“EchoShot · 拍同款”는 사용자가 직접 AI 플랫폼 API 키를 설정하고 명시적으로 선택한 웹 이미지를 분석하여 재현 프롬프트와 유사 이미지를 생성하고 결과를 로컬에서 관리하는 Chrome 확장 프로그램입니다.',
  '（近似值）': ' (근사값)',
  '通过此链接注册，插件开发者可能获得平台推广奖励，不影响您的使用价格。您也可以直接访问平台官网注册。': '이 링크를 통해 가입하면 확장 프로그램 개발자가 추천 보상을 받을 수 있습니다. 사용 가격에는 영향을 주지 않습니다. 플랫폼 공식 웹사이트에서 직접 가입할 수도 있습니다.',
  '部分 Get Key 链接属于平台邀请或推广链接。只有在用户主动点击后才会打开；开发者可能获得平台提供的推广奖励，但不会因此提高用户的使用价格。扩展不会自动跳转、替换网页链接、写入推广 Cookie，也不会跟踪用户是否注册或购买。': '일부 Get Key 링크는 플랫폼 초대 또는 추천 링크입니다. 사용자가 직접 클릭한 경우에만 열립니다. 개발자가 추천 보상을 받을 수 있지만 사용자 가격은 올라가지 않습니다. 확장 프로그램은 자동 이동, 웹페이지 링크 교체, 추천 쿠키 기록 또는 가입·구매 여부 추적을 하지 않습니다.',
  '框选截图': '영역 캡처', '隐藏魔法按钮': '매직 버튼 숨기기', '显示魔法按钮': '매직 버튼 표시', '角色与物品': '인물 및 사물', '平台与模型设置': '플랫폼 및 모델',
  '开始前，请确认数据使用方式': '시작하기 전에 데이터 사용 방식을 확인하세요', '我已阅读并同意上述数据处理方式': '위 데이터 처리 방식을 읽고 동의합니다', '同意并继续': '동의하고 계속', '查看完整隐私政策': '전체 개인정보 처리방침 보기',
  '还没有选择图片': '선택한 이미지가 없습니다', '📷 框选区域截图': '📷 영역 캡처', '打开相册': '앨범 열기', '来源图片': '원본 이미지', '正在获取图片…': '이미지 불러오는 중…',
  '提示词': '프롬프트', '重新反推': '다시 분석', '复制': '복사', '正在反推提示词…': '프롬프트 분석 중…', '✓ 反推成功，可直接编辑提示词': '✓ 분석 완료 · 편집할 수 있습니다', '反推': '분석 모델',
  '生成设置': '생성 설정', '比例': '화면 비율', '生图': '이미지 모델', '✨ 生成图片': '✨ 이미지 생성', '替换角色/物品': '인물/사물 교체', '✓ 生成成功': '✓ 생성 완료',
  '替换角色或者物品': '인물 또는 사물 교체', '管理素材': '소재 관리', '替换类型': '교체 유형', '人物或角色': '인물 또는 캐릭터', '物品': '물품', '服装或穿搭': '의상 또는 스타일링', '✨ 开始替换': '✨ 교체 시작', '正在替换角色或者物品…': '인물 또는 사물 교체 중…', '✓ 替换成功，已保存到相册': '✓ 교체 결과를 앨범에 저장했습니다',
  '主体一致组图': '주제가 일관된 이미지 세트', '同款结果': '생성 결과', '下载': '다운로드', '重新生成': '다시 생성', '查看相册': '앨범 보기', '✓ 已自动保存到相册': '✓ 앨범에 자동 저장했습니다',
  '角色与物品库': '인물 및 사물 라이브러리', '素材只保存在本机': '소재는 이 기기에만 저장됩니다', '＋ 添加角色或物品': '＋ 인물 또는 사물 추가', '关闭': '닫기', '在相册中查看大图': '앨범에서 크게 보기',
  '平台与模型管理': '플랫폼 및 모델 관리', '查看隐私政策': '개인정보 처리방침 보기', '① 平台管理': '① 플랫폼 관리', '自定义接口': '사용자 지정 API', '＋ 添加接口': '＋ API 추가', '平台列表': '플랫폼 목록',
  '② 默认模型': '② 기본 모델', '默认反推': '기본 분석 모델', '默认生图': '기본 이미지 모델', '③ 比例与尺寸': '③ 비율 및 크기', '默认比例': '기본 비율', '图像质量': '이미지 품질', '分辨率档位': '해상도', '保存设置': '설정 저장', '✓ 已保存': '✓ 저장됨', '隐私政策': '개인정보 처리방침',
  '全选': '전체 선택', '删除': '삭제', '设置': '설정', '已选': '선택됨', '张': '개', '上一页': '이전', '下一页': '다음', '相册还是空的': '앨범이 비어 있습니다', '原图': '원본', '同款图片': '생성 이미지', '准备对比…': '비교 준비 중…',
  '＋ 添加到角色库': '＋ 라이브러리에 추가', '添加到角色库': '인물 및 사물 라이브러리에 추가', '复制提示词': '프롬프트 복사', '反推原文': '원본 분석 프롬프트', '生成平台': '생성 플랫폼', '生成模型': '생성 모델', '尺寸': '크기', '生成时间': '생성 시간', '查看原图': '원본 보기', '来源页面': '원본 페이지', '访问页面': '페이지 열기',
  '✨ 再拍一张': '✨ 한 장 더 생성', '👤 替换角色': '👤 인물 교체', '替换角色': '인물 교체', '生成组图': '이미지 세트 생성', '确认删除': '삭제 확인', '取消': '취소', '搜索提示词 / 中文解读 / 模型…': '프롬프트 / 한국어 해설 / 모델 검색…', '上一张': '이전 이미지', '下一张': '다음 이미지', '韩语解读': '한국어 해설', '中文解读': '한국어 해설',
  '界面语言': '표시 언어', '自动（浏览器语言）': '자동(브라우저 언어)', '更新日期：2026 年 7 月 21 日': '업데이트: 2026년 7월 21일', '处理的数据': '처리하는 데이터', '数据用途与共享': '데이터 사용 및 공유', '本地保存与删除': '로컬 저장 및 삭제', '数据安全': '데이터 보안', '儿童隐私': '아동 개인정보 보호', '政策变更与联系': '정책 변경 및 문의'
  , '共 {count} 张': '총 {count}개', '组图 {index}/{count}': '세트 {index}/{count}', '第 {page} 页，共 {total} 页': '총 {total}페이지 중 {page}페이지', '搜索结果，第 {page} 页，共 {total} 页': '검색 결과, 총 {total}페이지 중 {page}페이지', '(无提示词)': '(프롬프트 없음)', '取消全选': '전체 선택 해제', '选择': '선택', '{width} × {height} 像素': '{width} × {height} 픽셀', '未找到匹配作品': '일치하는 작품이 없습니다', '可以尝试搜索其他提示词、中文解读、模型或平台名称。': '다른 프롬프트, 한국어 해설, 모델 또는 플랫폼 이름으로 검색해 보세요.'
  , '当你点击反推、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': '분석, 생성, 인물 교체 또는 이미지 세트 생성을 실행하면 선택한 원본 이미지, 참고 소재 및 프롬프트가 작업 처리를 위해 선택한 AI 플랫폼으로 전송됩니다.', 'API Key 仅保存在本机 Chrome 扩展存储中。': 'API 키는 이 기기의 Chrome 확장 프로그램 저장소에만 보관됩니다.', '来源图、角色/物品素材、提示词和生成结果保存在本机，可随时删除。': '원본 이미지, 인물/사물 소재, 프롬프트 및 생성 결과는 기기에 저장되며 언제든 삭제할 수 있습니다.', '插件不出售数据，也不将数据用于广告或用户画像。': '확장 프로그램은 데이터를 판매하지 않으며 광고나 사용자 프로파일링에 사용하지 않습니다.'
  , '可以直接编辑提示词': '프롬프트를 편집할 수 있습니다', '未启用反推模型': '활성화된 분석 모델이 없습니다', '未启用生图模型': '활성화된 이미지 모델이 없습니다', '尚未启用生图模型': '활성화된 이미지 모델이 없습니다', '默认生图': '기본 이미지 모델', '已设为默认反推模型': '기본 분석 모델을 변경했습니다', '已设为默认生图模型': '기본 이미지 모델을 변경했습니다', '请先反推或输入提示词': '먼저 프롬프트를 분석하거나 입력하세요', '正在反推提示词，已等待 {seconds} 秒…': '프롬프트 분석 중 · {seconds}초 경과…', '正在生成，已等待 {seconds} 秒…': '생성 중 · {seconds}초 경과…', '正在生成组图，已等待 {seconds} 秒…': '이미지 세트 생성 중 · {seconds}초 경과…', '已等待 {seconds} 秒…': '{seconds}초 경과…', '请在网页中拖动框选截图区域，按 Esc 可取消': '페이지에서 드래그하여 캡처 영역을 선택하세요. Esc를 누르면 취소됩니다.', '在相册中查看组图第 {index} 张，共 {count} 张': '앨범에서 {count}개 중 {index}번째 이미지 보기', '点击在相册中查看大图': '클릭하여 앨범에서 크게 보기', '组图第 {index} 张，共 {count} 张': '{count}개 중 {index}번째 이미지', '提示词已复制': '프롬프트를 복사했습니다', '魔法按钮已显示，点击隐藏': '매직 버튼이 표시 중입니다. 클릭하여 숨기기', '魔法按钮已隐藏，点击显示': '매직 버튼이 숨겨져 있습니다. 클릭하여 표시'
  , '新平台': '새 플랫폼', '尚未获取模型，可自动获取或手动添加。': '모델이 없습니다. 자동으로 가져오거나 직접 추가하세요.', '未启用的模型已隐藏，可打开上方开关查看。': '비활성 모델은 숨겨져 있습니다. 위 스위치로 표시할 수 있습니다.', '移除模型': '모델 제거', '未命名平台': '이름 없는 플랫폼', '已添加接口': '추가된 API', '删除平台': '플랫폼 삭제', '平台名称': '플랫폼 이름', '显示': '표시', '隐藏': '숨기기', '自动获取模型': '모델 자동 가져오기', '手动输入模型名称': '모델 이름 직접 입력', '添加': '추가', '模型名称与启用能力': '모델 및 기능', '显示未启用模型': '비활성 모델 표시', '尚未启用模型': '활성화된 모델 없음'
  , '✨ 反推提示词并生成同款': '✨ 프롬프트 분석 및 생성', '🖼 打开 EchoShot · 拍同款相册': '🖼 EchoShot · 拍同款 앨범 열기'
  , '无法对比': '비교할 수 없음', '无原图': '원본 없음', '开启对比': '비교 켜기', '关闭对比': '비교 끄기', '✓ 已在角色库': '✓ 라이브러리에 있음', '已在角色库': '인물 및 사물 라이브러리에 있음', '正在添加…': '추가 중…', '正在添加到角色库…': '인물 및 사물 라이브러리에 추가 중…', '这张图片已经在角色与物品库中': '이 이미지는 이미 인물 및 사물 라이브러리에 있습니다', '已添加到角色与物品库': '인물 및 사물 라이브러리에 추가했습니다', '确定删除这张图片吗？此操作不可恢复。': '이 이미지를 삭제할까요? 이 작업은 되돌릴 수 없습니다.', '已删除': '삭제됨'
  , '2 张': '2개', '4 张': '4개', '6 张': '6개', '8 张': '8개', '上一张（←）': '이전 이미지(←)', '下一张（→）': '다음 이미지(→)'
  , '反 {count}': '분석 {count}', '图 {count}': '이미지 {count}', '正在获取…': '가져오는 중…', '获取中…': '가져오는 중…', '已获取 {total} 个，新增 {added} 个': '{total}개 가져옴, {added}개 추가', '再次点击删除': '다시 클릭하여 삭제'
  , '浏览网页时，把鼠标悬停在图片上，点击右上角出现的魔法按钮，即可反推提示词并生成同款图片。': '웹 이미지에 마우스를 올리고 오른쪽 위의 매직 버튼을 클릭하면 프롬프트를 분석하고 비슷한 이미지를 생성할 수 있습니다.', '也可以在图片上点右键，选择「✨ 反推提示词并生成同款」。': '이미지를 마우스 오른쪽 버튼으로 클릭하고 “✨ 프롬프트 분석 및 생성”을 선택할 수도 있습니다.', '保持构图、背景和光影基本不变，只替换目标人物、角色或物品。请选择支持图生图/edit 的模型。': '구도, 배경 및 조명을 유지하면서 대상 인물이나 사물만 교체합니다. 이미지 편집을 지원하는 모델을 선택하세요.', '正在生成，通常需要 10–60 秒…': '생성 중입니다. 보통 10~60초가 걸립니다…', '反推得到的提示词会显示在这里，可以直接编辑': '분석한 프롬프트가 여기에 표시되며 직접 편집할 수 있습니다', '切换并保存为默认反推模型': '전환 후 기본 분석 모델로 저장', '切换并保存为默认生图模型': '전환 후 기본 이미지 모델로 저장'
  , '每个平台独立保存 API 地址和密钥。密钥仅保存在本机浏览器中；执行反推或生图时，所选图片和提示词会发送到你选择的 AI 平台。': '각 플랫폼의 API 주소와 키는 별도로 저장됩니다. 키는 이 브라우저에만 보관되며 작업 실행 시에만 선택한 이미지와 프롬프트가 선택한 AI 플랫폼으로 전송됩니다.', '支持 OpenAI 兼容的': 'OpenAI 호환', '侧边栏切换模型会自动保存；在这里修改后，请点击“保存设置”。后续任务都会使用新的默认值。': '사이드 패널에서 모델을 변경하면 자동 저장됩니다. 여기서 변경한 경우 “설정 저장”을 클릭하세요.', '比例会映射为生图接口的 size 参数，请按所选模型支持的尺寸填写。': '비율은 이미지 API의 size 매개변수에 대응합니다. 선택한 모델이 지원하는 크기를 입력하세요.', '插件会根据模型协议提交对应选项；不支持 Quality 或分辨率档位的模型仍使用上方像素尺寸。': '모델 프로토콜에 따라 품질 옵션을 전송하며, 지원하지 않는 모델은 위 픽셀 크기를 사용합니다.'
  , '“拍同款”是一款由用户自行配置 AI 平台 API Key 的 Chrome 扩展，用于分析用户主动选择的网页图片、生成复刻提示词及同款图片，并在本机管理生成记录。': '“같은 이미지 만들기”는 사용자가 직접 AI 플랫폼 API 키를 설정하고 명시적으로 선택한 웹 이미지를 분석하여 재현 프롬프트와 유사 이미지를 생성하고 결과를 로컬에서 관리하는 Chrome 확장 프로그램입니다.', 'API 配置：': 'API 설정:', '平台名称、Base URL、模型名称及用户填写的 API Key。': '플랫폼 이름, Base URL, 모델 이름 및 사용자가 입력한 API 키.', '主动选择的内容：': '사용자가 선택한 콘텐츠:', '网页图片、用户主动框选截取的当前可见页面区域、图片地址、所在页面 URL 和页面标题。': '웹 이미지, 사용자가 직접 캡처한 현재 보이는 페이지 영역, 이미지 URL, 페이지 URL 및 제목.', '替换参考素材：': '교체 참고 소재:', '用户添加到本机角色与物品库中的图片和名称。': '로컬 인물 및 사물 라이브러리에 추가한 이미지와 이름.', '用户生成内容：': '사용자 생성 콘텐츠:', '反推提示词、用户编辑后的提示词、生成图片及生成参数。': '분석 프롬프트, 사용자가 편집한 프롬프트, 생성 이미지 및 생성 매개변수.', '本地任务状态：': '로컬 작업 상태:', '当前任务、模型选择、相册记录和界面设置。': '현재 작업, 모델 선택, 앨범 기록 및 인터페이스 설정.', '扩展不收集姓名、邮箱、通讯录、精确位置、支付卡信息，也不创建跨网站用户画像。': '이름, 이메일, 연락처, 정확한 위치 또는 결제 카드 정보를 수집하지 않으며 사이트 간 사용자 프로필을 만들지 않습니다.'
  , '只有当用户点击反推、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。': '사용자가 분석, 생성, 인물 교체 또는 이미지 세트 작업을 시작할 때만 필요한 원본 이미지, 참고 소재 및 프롬프트를 선택한 AI 플랫폼으로 전송합니다.', 'API Key 仅用于向该平台鉴权。扩展开发者不运营中转服务器，也不会接收用户的 API Key、图片或提示词。': 'API 키는 선택한 플랫폼 인증에만 사용됩니다. 개발자는 중계 서버를 운영하지 않으며 사용자의 API 키, 이미지 또는 프롬프트를 받지 않습니다.', '内置平台包括 OpenAI、ModelScope、SiliconFlow、Agnes-AI、ZenMux、RunningHUB、AtlasCloud、APImart、OpenRouter、QianwenAI 和 Aliyun Token Plan；用户也可以配置自己的兼容服务。': '내장 플랫폼에는 OpenAI, ModelScope, SiliconFlow, Agnes-AI, ZenMux, RunningHUB, AtlasCloud, APImart, OpenRouter, QianwenAI 및 Aliyun Token Plan이 있으며 호환 서비스를 직접 설정할 수도 있습니다.', '第三方平台如何保存和处理请求，由相应平台的隐私政策及用户与该平台之间的协议决定。': '타사 플랫폼의 요청 저장 및 처리는 각 플랫폼의 개인정보 처리방침과 사용자 계약을 따릅니다.', '除完成用户明确请求的反推、生图，或法律、安全所必需的情形外，扩展不会向其他第三方传输数据。': '사용자가 명시적으로 요청한 작업 수행 또는 법률·보안상 필요한 경우를 제외하고 다른 제3자에게 데이터를 전송하지 않습니다.'
  , 'API 配置保存在': 'API 설정은', '，并限制为扩展可信页面和后台访问。': '에 저장되며 신뢰할 수 있는 확장 페이지와 백그라운드에서만 접근할 수 있습니다.', '当前任务临时保存在': '현재 작업은 임시로', '。': '.', '来源图、角色/物品参考素材、提示词和生成图片保存在本机 IndexedDB 中。': '원본 이미지, 인물/사물 참고 소재, 프롬프트 및 생성 이미지는 로컬 IndexedDB에 저장됩니다.', '用户可以删除 API Key、参考素材和相册作品；卸载扩展会清除 Chrome 管理的扩展本地数据。': 'API 키, 참고 소재 및 앨범 작품을 삭제할 수 있으며 확장 프로그램을 제거하면 Chrome이 관리하는 로컬 데이터도 삭제됩니다.', '预设 AI 平台均使用 HTTPS。': '기본 AI 플랫폼은 HTTPS를 사용합니다.', '自定义 API Base URL 必须使用 HTTPS；仅本机 localhost 调试允许 HTTP。': '사용자 지정 API Base URL은 HTTPS를 사용해야 하며 localhost 개발 시에만 HTTP가 허용됩니다.', '扩展不加载或执行远程 JavaScript，全部运行逻辑均包含在安装包中。': '원격 JavaScript를 불러오거나 실행하지 않으며 모든 실행 로직은 설치 패키지에 포함됩니다.', '扩展不会出售用户数据，不会将用户数据用于个性化广告、再营销、信用评估或数据经纪，也不会允许开发者或其他人员读取用户内容；法律义务或用户明确请求的支持情形除外。': '사용자 데이터를 판매하거나 맞춤 광고, 리마케팅, 신용 평가 또는 데이터 중개에 사용하지 않습니다. 법적 의무나 사용자가 명시적으로 요청한 지원을 제외하고 개발자 또는 다른 사람이 사용자 콘텐츠를 읽을 수 없습니다.', '扩展对用户数据的使用遵守 Chrome Web Store User Data Policy，包括 Limited Use 要求。': '사용자 데이터 사용은 Limited Use 요건을 포함한 Chrome Web Store User Data Policy를 준수합니다.', '扩展并非专门面向儿童，也不会有意收集儿童个人信息。': '아동을 대상으로 하지 않으며 아동의 개인정보를 의도적으로 수집하지 않습니다.', '如数据处理方式发生实质变化，扩展会在实施前通过产品界面提示，并在需要时重新征得同意。有关隐私的问题，可通过 Chrome Web Store 商品页面的“支持”入口联系发布者。': '데이터 처리 방식이 크게 변경되면 적용 전에 제품 화면에서 알리고 필요한 경우 다시 동의를 받습니다. 개인정보 관련 문의는 Chrome Web Store 상품 페이지의 지원 링크를 통해 게시자에게 연락할 수 있습니다.'
};

JA['更新日期：2026 年 7 月 22 日'] = '更新日：2026年7月22日';
KO['更新日期：2026 年 7 月 22 日'] = '업데이트: 2026년 7월 22일';

Object.assign(EN, {
  '停止任务': 'Stop',
  '正在停止任务': 'Stopping task',
  '正在停止任务…': 'Stopping task…',
  '任务已停止': 'Task stopped',
  '当前没有可停止的任务': 'There is no active task to stop',
  '已请求停止任务；当前已提交的图片仍会完成并保存': 'Stop requested. Any image already submitted will still finish and be saved.',
  '停止任务失败：{error}': 'Could not stop task: {error}',
  '取消截图失败：{error}': 'Could not cancel area capture: {error}',
  '惊喜随机提示词': 'Surprise Prompt',
  '🎲 给我惊喜': '🎲 Surprise Me',
  '给我惊喜': 'Surprise Me',
  '第一次使用？': 'First time here?',
  '如果您是第一次使用，请先打开设置，添加API key，并配置好默认模型。': 'If this is your first time, open Settings, add your API key, and choose the default models.',
  '打开设置': 'Open Settings',
  '将鼠标移到网页图片上，点击魔法按钮；目标不是图片时，可使用框选截图。': 'Hover over a web image and click the magic button. If the target is not an image, capture an area instead.',
  '也可以直接使用“惊喜创作”，随机生成提示词后再生成图片。': 'Or use Surprise Mode to create a random prompt, then generate an image.',
  '惊喜创作模式': 'Surprise Mode',
  '惊喜模式下不可用': 'Unavailable in Surprise Mode',
  '惊喜模式没有参考图片，无法替换角色或物品。请先选择一张来源图片。': 'Surprise Mode has no reference image, so characters or objects cannot be replaced. Select a source image first.',
  'AI 随机创作': 'AI Random Creation',
  '正在生成惊喜提示词…': 'Generating a surprise prompt…',
  'AI反推模型': 'AI Vision Model',
  '图片比例': 'Image Aspect Ratio',
  'AI生图模型': 'AI Image Generation Model',
  'AI惊喜提示词生成中…': 'AI is creating a surprise prompt…',
  '正在调用所选反推模型，请稍候': 'Calling the selected analysis model. Please wait.',
  '生成惊喜提示词失败': 'Could not generate the surprise prompt',
  '生成惊喜提示词失败：{error}': 'Could not generate the surprise prompt: {error}',
  '反推模型未返回随机提示词': 'The analysis model returned no surprise prompt',
  '已保存为默认反推模型，将在下次惊喜生成时生效': 'Saved as the default vision model. It will apply to the next Surprise prompt.',
  '不使用参考图': 'No reference image',
  '再来一次': 'Try Again',
  '写实摄影': 'Realistic Photo',
  '电影剧照': 'Film Still',
  '插画/平面': 'Illustration',
  '3D/实体艺术': '3D / Physical Art',
  '惊喜提示词已生成': 'Surprise prompt ready',
  '惊喜模式需要文生图模型，请切换到支持文生图的模型': 'Surprise mode needs a text-to-image model. Switch to a model that supports text-to-image.',
  '当前模型仅支持图片编辑，请切换到支持文生图的模型': 'The selected model only supports image editing. Switch to a text-to-image model.',
  '任务已停止，当前已完成的图片已保存': 'Task stopped. The completed image has been saved.',
  '任务已停止，已保留 {count} 张图片': 'Task stopped. {count} image(s) were kept.',
  '已设为默认比例': 'Default aspect ratio updated',
  '保存默认比例失败：{error}': 'Could not save the default aspect ratio: {error}',
  '保存默认模型失败：{error}': 'Could not save the default model: {error}',
  '操作失败：{error}': 'Operation failed: {error}',
  '读取图片状态失败：{error}': 'Could not read image status: {error}',
  '正在处理当前页面图片…': 'Processing the image from this page…',
  '图片获取失败：{error}': 'Could not load image: {error}',
  '原图尺寸 {width}×{height}': 'Original size {width}×{height}',
  '恢复上次任务失败：{error}': 'Could not restore the previous task: {error}',
  '反推失败：{error}': 'Prompt analysis failed: {error}',
  '未知错误': 'Unknown error',
  '当前生图模型需要来源图片，请先选择图片': 'The selected image model requires a source image. Select one first.',
  '上一张图片生成失败：{error}': 'The previous image failed: {error}',
  '生成失败：{error}': 'Generation failed: {error}',
  '上一张图片的生成已完成，已保存到相册': 'The previous image is complete and has been saved to the album.',
  '无法开始截图：{error}': 'Could not start capture: {error}',
  '请确认当前是普通网页': 'Make sure the current tab is a regular web page',
  '扩展尚未连接当前网页，请刷新页面后重试': 'The extension is not connected to this page yet. Refresh the page and try again.',
  '当前页面截图权限不可用，请返回网页后重新点击框选截图': 'Capture permission is unavailable for this tab. Return to the page and click Capture Area again.',
  '当前页面不允许扩展运行，请在普通 HTTP/HTTPS 网页中使用': 'Extensions cannot run on this page. Open a regular HTTP/HTTPS webpage and try again.',
  '未找到当前网页标签': 'The current webpage tab could not be found.',
  '当前页面不支持截图，请在普通 HTTP/HTTPS 网页中使用': 'This page cannot be captured. Open a regular HTTP/HTTPS webpage and try again.',
  '无法进入框选模式': 'Could not enter area-selection mode.',
  '截图区域无效，请重新框选': 'The selected area is invalid. Draw the capture area again.',
  '未找到需要截图的网页': 'The webpage to capture could not be found.',
  '裁切后的截图数据无效': 'The captured image data is invalid.',
  '裁切后的截图尺寸无效': 'The captured image size is invalid.',
  '当前已有生成任务进行中': 'A generation task is already running',
  '请先选择需要修改的图片': 'Select an image to edit first',
  '当前模型最多支持 1 张参考图，无法替换角色或物品；请切换到支持多参考图的模型': 'This model supports only one reference image and cannot replace a character or object. Switch to a model that supports multiple references.',
  '当前 OpenRouter 模型不支持图片编辑，请切换生图模型': 'The selected OpenRouter model does not support image editing. Switch image models.',
  '正在替换角色或者物品…': 'Replacing the person or object…',
  '正在替换角色或者物品，已等待 {seconds} 秒…': 'Replacing the person or object, {seconds}s elapsed…',
  '上一张图片的替换已完成，已保存到相册': 'The replacement for the previous image is complete and saved to the album.',
  '替换失败：{error}': 'Replacement failed: {error}',
  '{label}完成，已保存到相册': '{label} complete and saved to the album',
  '角色/物品替换': 'Person/object replacement',
  '{stage}，已等待 {seconds} 秒…': '{stage} · {seconds}s elapsed…',
  '{count} 张组图已完成并保存到相册；用时 {seconds} 秒。': '{count} images completed and saved to the album in {seconds}s.',
  '组图生成中断：{error}{saved}': 'Image set interrupted: {error}{saved}',
  '；已保留前 {count} 张。': '; kept the first {count} image(s).',
  '{action}失败：{error}': '{action} failed: {error}',
  '替换': 'Replacement',
  '生成': 'Generation',
  '缺少原作品提示词': 'The original prompt is missing',
  '缺少组图来源大图，请从相册大图重新发起': 'The source image is missing. Start the image set again from the album viewer.',
  '正在基于当前大图生成主体锚点 {current}/{total}': 'Creating identity anchor {current}/{total} from the current image',
  '正在基于主体锚点生成第 {current}/{total} 张': 'Generating image {current}/{total} from the identity anchor',
  '正在使用文生图生成第 {current}/{total} 张': 'Generating text-to-image {current}/{total}',
  '当前模型不支持图生图，正在使用文生图生成第 {current}/{total} 张': 'This model does not support image editing; generating text-to-image {current}/{total}',
  '当前模型不支持图生图，已自动切换为文生图组图': 'This model does not support image editing. Switched to text-to-image automatically.',
  '组图完成：已保存 {count} 张': 'Image set complete: {count} saved',
  '上一张图片的组图任务已结束，请到相册查看已保存结果': 'The previous image-set task ended. Check the album for saved results.',
  '组图生成中断（已等待 {seconds} 秒）：{error}{saved}': 'Image set interrupted after {seconds}s: {error}{saved}',
  '；已保留并保存前 {count} 张。': '; kept and saved the first {count} image(s).',
  '已保存前 {count} 张，后续生成失败': 'Saved the first {count} image(s); later generations failed',
  '组图生成失败': 'Image-set generation failed',
  '未找到相册作品': 'Album item not found',
  '这张图片还未保存到相册': 'This image has not been saved to the album yet',
  '保存授权失败：{error}': 'Could not save consent: {error}',
  '初始化失败：{error}': 'Initialization failed: {error}',
  '正在调用生图模型': 'Calling the image model',
  '正在保存到相册': 'Saving to album',
  '正在编辑图片': 'Editing image',
  '正在生成同款图片': 'Generating a similar image',
  '正在生成': 'Generating',
  '正在打包 {count} 张图片…': 'Packaging {count} image(s)…',
  '为降低内存占用，将下载 {count} 个 ZIP 分包；请允许多文件下载': 'To reduce memory use, {count} ZIP files will be downloaded. Allow multiple downloads.',
  '已删除 {count} 张图片': 'Deleted {count} image(s)',
  '打开设置失败：{error}': 'Could not open settings: {error}',
  '添加到角色库失败：{error}': 'Could not add to the person/object library: {error}',
  '尚未取得当前窗口信息，请稍后重试': 'Window information is not available yet. Try again shortly.',
  '已在独立窗口中打开': 'Opened in a separate window',
  '打开侧边栏失败：{error}': 'Could not open the side panel: {error}',
  '请先填写 Base URL 和 API Key': 'Enter the Base URL and API Key first',
  '请输入新的模型名称': 'Enter a new model name'
});

Object.assign(JA, {
  '停止任务': '停止',
  '正在停止任务': 'タスクを停止中',
  '正在停止任务…': 'タスクを停止中…',
  '任务已停止': 'タスクを停止しました',
  '当前没有可停止的任务': '停止できる実行中のタスクはありません',
  '已请求停止任务；当前已提交的图片仍会完成并保存': '停止を要求しました。送信済みの画像は完了後に保存されます。',
  '停止任务失败：{error}': 'タスクを停止できませんでした：{error}',
  '取消截图失败：{error}': '範囲キャプチャをキャンセルできませんでした：{error}',
  '惊喜随机提示词': 'ランダムプロンプト',
  '🎲 给我惊喜': '🎲 おまかせ',
  '给我惊喜': 'おまかせ',
  '第一次使用？': '初めて使いますか？',
  '如果您是第一次使用，请先打开设置，添加API key，并配置好默认模型。': '初めて使う場合は、設定を開いてAPIキーを追加し、既定のモデルを設定してください。',
  '打开设置': '設定を開く',
  '将鼠标移到网页图片上，点击魔法按钮；目标不是图片时，可使用框选截图。': 'ウェブ画像にカーソルを合わせてマジックボタンを押します。画像でない対象は範囲キャプチャを使用できます。',
  '也可以直接使用“惊喜创作”，随机生成提示词后再生成图片。': '「おまかせ」を使ってランダムなプロンプトを作り、そのまま画像を生成することもできます。',
  '惊喜创作模式': 'ランダム生成モード',
  '惊喜模式下不可用': 'ランダム生成モードでは使用不可',
  '惊喜模式没有参考图片，无法替换角色或物品。请先选择一张来源图片。': 'ランダム生成モードには参照画像がないため、人物やアイテムを置換できません。先に元画像を選択してください。',
  'AI 随机创作': 'AIランダム生成',
  '正在生成惊喜提示词…': 'ランダムプロンプトを生成中…',
  'AI反推模型': 'AI解析モデル',
  '图片比例': '画像のアスペクト比',
  'AI生图模型': 'AI画像生成モデル',
  'AI惊喜提示词生成中…': 'AIがランダムプロンプトを生成中…',
  '正在调用所选反推模型，请稍候': '選択した解析モデルを呼び出しています。しばらくお待ちください。',
  '生成惊喜提示词失败': 'ランダムプロンプトを生成できませんでした',
  '生成惊喜提示词失败：{error}': 'ランダムプロンプトを生成できませんでした：{error}',
  '反推模型未返回随机提示词': '解析モデルからランダムプロンプトが返されませんでした',
  '已保存为默认反推模型，将在下次惊喜生成时生效': 'デフォルト解析モデルとして保存しました。次回のランダムプロンプト生成から適用されます。',
  '不使用参考图': '参照画像なし',
  '再来一次': 'もう一度',
  '写实摄影': 'リアル写真',
  '电影剧照': '映画スチル',
  '插画/平面': 'イラスト',
  '3D/实体艺术': '3D・立体アート',
  '惊喜提示词已生成': 'ランダムプロンプトを生成しました',
  '惊喜模式需要文生图模型，请切换到支持文生图的模型': 'ランダム生成にはテキスト画像生成モデルが必要です。対応モデルに切り替えてください。',
  '当前模型仅支持图片编辑，请切换到支持文生图的模型': '選択中のモデルは画像編集専用です。テキスト画像生成対応モデルに切り替えてください。',
  '任务已停止，当前已完成的图片已保存': 'タスクを停止しました。完了した画像は保存済みです。',
  '任务已停止，已保留 {count} 张图片': 'タスクを停止し、{count}枚を保存しました。',
  '已设为默认比例': 'デフォルト比率を更新しました',
  '保存默认比例失败：{error}': 'デフォルト比率を保存できませんでした：{error}',
  '保存默认模型失败：{error}': '既定モデルを保存できませんでした：{error}',
  '操作失败：{error}': '操作に失敗しました：{error}',
  '读取图片状态失败：{error}': '画像状態を取得できませんでした：{error}',
  '正在处理当前页面图片…': '現在のページの画像を処理中…',
  '图片获取失败：{error}': '画像を取得できませんでした：{error}',
  '原图尺寸 {width}×{height}': '元画像サイズ {width}×{height}',
  '恢复上次任务失败：{error}': '前回のタスクを復元できませんでした：{error}',
  '反推失败：{error}': 'プロンプト解析に失敗しました：{error}',
  '未知错误': '不明なエラー',
  '当前生图模型需要来源图片，请先选择图片': '選択したモデルには元画像が必要です。先に画像を選択してください。',
  '上一张图片生成失败：{error}': '前の画像生成に失敗しました：{error}',
  '生成失败：{error}': '生成に失敗しました：{error}',
  '上一张图片的生成已完成，已保存到相册': '前の画像生成が完了し、アルバムに保存されました。',
  '无法开始截图：{error}': 'キャプチャを開始できません：{error}',
  '请确认当前是普通网页': '通常のWebページを開いているか確認してください',
  '扩展尚未连接当前网页，请刷新页面后重试': '拡張機能がこのページに接続されていません。ページを再読み込みして、もう一度お試しください。',
  '当前页面截图权限不可用，请返回网页后重新点击框选截图': 'このタブではキャプチャ権限を使用できません。Webページに戻り、もう一度範囲キャプチャを押してください。',
  '当前页面不允许扩展运行，请在普通 HTTP/HTTPS 网页中使用': 'このページでは拡張機能を実行できません。通常のHTTP/HTTPSページでお試しください。',
  '未找到当前网页标签': '現在のWebページタブが見つかりません。',
  '当前页面不支持截图，请在普通 HTTP/HTTPS 网页中使用': 'このページはキャプチャできません。通常のHTTP/HTTPSページでお試しください。',
  '无法进入框选模式': '範囲選択モードを開始できません。',
  '截图区域无效，请重新框选': '選択範囲が無効です。もう一度範囲を選択してください。',
  '未找到需要截图的网页': 'キャプチャするWebページが見つかりません。',
  '裁切后的截图数据无效': 'キャプチャした画像データが無効です。',
  '裁切后的截图尺寸无效': 'キャプチャした画像サイズが無効です。',
  '当前已有生成任务进行中': '生成タスクがすでに実行中です',
  '请先选择需要修改的图片': '編集する画像を先に選択してください',
  '当前模型最多支持 1 张参考图，无法替换角色或物品；请切换到支持多参考图的模型': 'このモデルは参照画像を1枚しか使用できないため、人物や物を置換できません。複数参照対応モデルに切り替えてください。',
  '当前 OpenRouter 模型不支持图片编辑，请切换生图模型': '選択中のOpenRouterモデルは画像編集に対応していません。画像モデルを切り替えてください。',
  '正在替换角色或者物品…': '人物または物を置換中…',
  '正在替换角色或者物品，已等待 {seconds} 秒…': '人物または物を置換中 · {seconds}秒経過…',
  '上一张图片的替换已完成，已保存到相册': '前の画像の置換が完了し、アルバムに保存されました。',
  '替换失败：{error}': '置換に失敗しました：{error}',
  '{label}完成，已保存到相册': '{label}が完了し、アルバムに保存されました',
  '角色/物品替换': '人物・物の置換',
  '{stage}，已等待 {seconds} 秒…': '{stage} · {seconds}秒経過…',
  '{count} 张组图已完成并保存到相册；用时 {seconds} 秒。': '{count}枚を生成し、アルバムに保存しました（{seconds}秒）。',
  '组图生成中断：{error}{saved}': '画像セットの生成が中断されました：{error}{saved}',
  '；已保留前 {count} 张。': '；最初の{count}枚を保持しました。',
  '{action}失败：{error}': '{action}に失敗しました：{error}',
  '替换': '置換',
  '生成': '生成',
  '缺少原作品提示词': '元作品のプロンプトがありません',
  '缺少组图来源大图，请从相册大图重新发起': '元画像がありません。アルバムの拡大表示から再実行してください。',
  '正在基于当前大图生成主体锚点 {current}/{total}': '現在の画像から主体アンカーを作成中 {current}/{total}',
  '正在基于主体锚点生成第 {current}/{total} 张': '主体アンカーから画像を生成中 {current}/{total}',
  '正在使用文生图生成第 {current}/{total} 张': 'テキストから画像を生成中 {current}/{total}',
  '当前模型不支持图生图，正在使用文生图生成第 {current}/{total} 张': 'このモデルは画像編集非対応のため、テキストから生成中 {current}/{total}',
  '当前模型不支持图生图，已自动切换为文生图组图': '画像編集非対応のため、テキスト生成に自動切替しました。',
  '组图完成：已保存 {count} 张': '画像セット完了：{count}枚保存',
  '上一张图片的组图任务已结束，请到相册查看已保存结果': '前の画像セットタスクが終了しました。保存結果はアルバムで確認できます。',
  '组图生成中断（已等待 {seconds} 秒）：{error}{saved}': '画像セットが{seconds}秒後に中断：{error}{saved}',
  '；已保留并保存前 {count} 张。': '；最初の{count}枚を保存しました。',
  '已保存前 {count} 张，后续生成失败': '最初の{count}枚を保存しましたが、後続の生成に失敗しました',
  '组图生成失败': '画像セットの生成に失敗しました',
  '未找到相册作品': 'アルバム作品が見つかりません',
  '这张图片还未保存到相册': 'この画像はまだアルバムに保存されていません',
  '保存授权失败：{error}': '同意内容を保存できませんでした：{error}',
  '初始化失败：{error}': '初期化に失敗しました：{error}',
  '正在调用生图模型': '画像モデルを呼び出し中',
  '正在保存到相册': 'アルバムに保存中',
  '正在编辑图片': '画像を編集中',
  '正在生成同款图片': '同じスタイルの画像を生成中',
  '正在生成': '生成中',
  '正在打包 {count} 张图片…': '{count}枚をパッケージ中…',
  '为降低内存占用，将下载 {count} 个 ZIP 分包；请允许多文件下载': 'メモリ使用量を抑えるため{count}個のZIPをダウンロードします。複数ダウンロードを許可してください。',
  '已删除 {count} 张图片': '{count}枚を削除しました',
  '打开设置失败：{error}': '設定を開けません：{error}',
  '添加到角色库失败：{error}': '人物・物ライブラリに追加できません：{error}',
  '尚未取得当前窗口信息，请稍后重试': 'ウィンドウ情報を取得中です。少し待って再試行してください。',
  '已在独立窗口中打开': '別ウィンドウで開きました',
  '打开侧边栏失败：{error}': 'サイドパネルを開けません：{error}',
  '请先填写 Base URL 和 API Key': '先にBase URLとAPI Keyを入力してください',
  '请输入新的模型名称': '新しいモデル名を入力してください'
});

Object.assign(KO, {
  '停止任务': '중지',
  '正在停止任务': '작업 중지 중',
  '正在停止任务…': '작업 중지 중…',
  '任务已停止': '작업이 중지되었습니다',
  '当前没有可停止的任务': '중지할 실행 중인 작업이 없습니다',
  '已请求停止任务；当前已提交的图片仍会完成并保存': '중지를 요청했습니다. 이미 제출된 이미지는 완료 후 저장됩니다.',
  '停止任务失败：{error}': '작업을 중지하지 못했습니다: {error}',
  '取消截图失败：{error}': '영역 캡처를 취소하지 못했습니다: {error}',
  '惊喜随机提示词': '랜덤 프롬프트',
  '🎲 给我惊喜': '🎲 랜덤 생성',
  '给我惊喜': '랜덤 생성',
  '第一次使用？': '처음 사용하시나요?',
  '如果您是第一次使用，请先打开设置，添加API key，并配置好默认模型。': '처음 사용하는 경우 설정을 열고 API 키를 추가한 다음 기본 모델을 지정하세요.',
  '打开设置': '설정 열기',
  '将鼠标移到网页图片上，点击魔法按钮；目标不是图片时，可使用框选截图。': '웹 이미지에 마우스를 올리고 마법 버튼을 누르세요. 이미지가 아닌 대상은 영역 캡처를 사용할 수 있습니다.',
  '也可以直接使用“惊喜创作”，随机生成提示词后再生成图片。': '또는 랜덤 생성을 사용해 프롬프트를 만든 뒤 이미지를 생성할 수 있습니다.',
  '惊喜创作模式': '랜덤 생성 모드',
  '惊喜模式下不可用': '랜덤 생성 모드에서 사용할 수 없음',
  '惊喜模式没有参考图片，无法替换角色或物品。请先选择一张来源图片。': '랜덤 생성 모드에는 참고 이미지가 없어 인물이나 사물을 교체할 수 없습니다. 먼저 원본 이미지를 선택하세요.',
  'AI 随机创作': 'AI 랜덤 생성',
  '正在生成惊喜提示词…': '랜덤 프롬프트 생성 중…',
  'AI反推模型': 'AI 분석 모델',
  '图片比例': '이미지 화면 비율',
  'AI生图模型': 'AI 이미지 생성 모델',
  'AI惊喜提示词生成中…': 'AI 랜덤 프롬프트 생성 중…',
  '正在调用所选反推模型，请稍候': '선택한 분석 모델을 호출하고 있습니다. 잠시 기다려 주세요.',
  '生成惊喜提示词失败': '랜덤 프롬프트를 생성하지 못했습니다',
  '生成惊喜提示词失败：{error}': '랜덤 프롬프트를 생성하지 못했습니다: {error}',
  '反推模型未返回随机提示词': '분석 모델이 랜덤 프롬프트를 반환하지 않았습니다',
  '已保存为默认反推模型，将在下次惊喜生成时生效': '기본 분석 모델로 저장했습니다. 다음 랜덤 프롬프트 생성부터 적용됩니다.',
  '不使用参考图': '참조 이미지 없음',
  '再来一次': '다시 생성',
  '写实摄影': '사실적 사진',
  '电影剧照': '영화 스틸',
  '插画/平面': '일러스트',
  '3D/实体艺术': '3D·입체 아트',
  '惊喜提示词已生成': '랜덤 프롬프트가 준비되었습니다',
  '惊喜模式需要文生图模型，请切换到支持文生图的模型': '랜덤 생성에는 텍스트 이미지 생성 모델이 필요합니다. 지원 모델로 전환하세요.',
  '当前模型仅支持图片编辑，请切换到支持文生图的模型': '선택한 모델은 이미지 편집 전용입니다. 텍스트 이미지 생성 모델로 전환하세요.',
  '任务已停止，当前已完成的图片已保存': '작업이 중지되었습니다. 완료된 이미지는 저장되었습니다.',
  '任务已停止，已保留 {count} 张图片': '작업이 중지되었습니다. 이미지 {count}장을 보관했습니다.',
  '已设为默认比例': '기본 비율을 변경했습니다',
  '保存默认比例失败：{error}': '기본 비율을 저장하지 못했습니다: {error}',
  '保存默认模型失败：{error}': '기본 모델을 저장하지 못했습니다: {error}',
  '操作失败：{error}': '작업 실패: {error}',
  '读取图片状态失败：{error}': '이미지 상태를 읽지 못했습니다: {error}',
  '正在处理当前页面图片…': '현재 페이지 이미지를 처리 중…',
  '图片获取失败：{error}': '이미지를 가져오지 못했습니다: {error}',
  '原图尺寸 {width}×{height}': '원본 크기 {width}×{height}',
  '恢复上次任务失败：{error}': '이전 작업을 복원하지 못했습니다: {error}',
  '反推失败：{error}': '프롬프트 분석 실패: {error}',
  '未知错误': '알 수 없는 오류',
  '当前生图模型需要来源图片，请先选择图片': '선택한 이미지 모델에는 원본 이미지가 필요합니다. 먼저 이미지를 선택하세요.',
  '上一张图片生成失败：{error}': '이전 이미지 생성 실패: {error}',
  '生成失败：{error}': '생성 실패: {error}',
  '上一张图片的生成已完成，已保存到相册': '이전 이미지 생성이 완료되어 앨범에 저장되었습니다.',
  '无法开始截图：{error}': '캡처를 시작할 수 없습니다: {error}',
  '请确认当前是普通网页': '현재 탭이 일반 웹페이지인지 확인하세요',
  '扩展尚未连接当前网页，请刷新页面后重试': '확장 프로그램이 아직 이 페이지에 연결되지 않았습니다. 페이지를 새로고침한 후 다시 시도하세요.',
  '当前页面截图权限不可用，请返回网页后重新点击框选截图': '이 탭에서 캡처 권한을 사용할 수 없습니다. 웹페이지로 돌아가 영역 캡처를 다시 누르세요.',
  '当前页面不允许扩展运行，请在普通 HTTP/HTTPS 网页中使用': '이 페이지에서는 확장 프로그램을 실행할 수 없습니다. 일반 HTTP/HTTPS 웹페이지에서 다시 시도하세요.',
  '未找到当前网页标签': '현재 웹페이지 탭을 찾을 수 없습니다.',
  '当前页面不支持截图，请在普通 HTTP/HTTPS 网页中使用': '이 페이지는 캡처할 수 없습니다. 일반 HTTP/HTTPS 웹페이지에서 다시 시도하세요.',
  '无法进入框选模式': '영역 선택 모드를 시작할 수 없습니다.',
  '截图区域无效，请重新框选': '선택한 영역이 올바르지 않습니다. 다시 영역을 선택하세요.',
  '未找到需要截图的网页': '캡처할 웹페이지를 찾을 수 없습니다.',
  '裁切后的截图数据无效': '캡처한 이미지 데이터가 올바르지 않습니다.',
  '裁切后的截图尺寸无效': '캡처한 이미지 크기가 올바르지 않습니다.',
  '当前已有生成任务进行中': '이미 생성 작업이 실행 중입니다',
  '请先选择需要修改的图片': '먼저 편집할 이미지를 선택하세요',
  '当前模型最多支持 1 张参考图，无法替换角色或物品；请切换到支持多参考图的模型': '이 모델은 참조 이미지를 1장만 지원하므로 인물이나 사물을 교체할 수 없습니다. 다중 참조 지원 모델로 전환하세요.',
  '当前 OpenRouter 模型不支持图片编辑，请切换生图模型': '선택한 OpenRouter 모델은 이미지 편집을 지원하지 않습니다. 이미지 모델을 전환하세요.',
  '正在替换角色或者物品…': '인물 또는 사물을 교체 중…',
  '正在替换角色或者物品，已等待 {seconds} 秒…': '인물 또는 사물을 교체 중 · {seconds}초 경과…',
  '上一张图片的替换已完成，已保存到相册': '이전 이미지 교체가 완료되어 앨범에 저장되었습니다.',
  '替换失败：{error}': '교체 실패: {error}',
  '{label}完成，已保存到相册': '{label} 완료, 앨범에 저장됨',
  '角色/物品替换': '인물/사물 교체',
  '{stage}，已等待 {seconds} 秒…': '{stage} · {seconds}초 경과…',
  '{count} 张组图已完成并保存到相册；用时 {seconds} 秒。': '이미지 {count}장을 완료하여 앨범에 저장했습니다. {seconds}초 소요.',
  '组图生成中断：{error}{saved}': '이미지 세트 생성 중단: {error}{saved}',
  '；已保留前 {count} 张。': '; 처음 {count}장을 보관했습니다.',
  '{action}失败：{error}': '{action} 실패: {error}',
  '替换': '교체',
  '生成': '생성',
  '缺少原作品提示词': '원본 프롬프트가 없습니다',
  '缺少组图来源大图，请从相册大图重新发起': '원본 이미지가 없습니다. 앨범 큰 이미지에서 다시 시작하세요.',
  '正在基于当前大图生成主体锚点 {current}/{total}': '현재 이미지로 주체 앵커 생성 중 {current}/{total}',
  '正在基于主体锚点生成第 {current}/{total} 张': '주체 앵커로 이미지 생성 중 {current}/{total}',
  '正在使用文生图生成第 {current}/{total} 张': '텍스트로 이미지 생성 중 {current}/{total}',
  '当前模型不支持图生图，正在使用文生图生成第 {current}/{total} 张': '이 모델은 이미지 편집을 지원하지 않아 텍스트로 생성 중 {current}/{total}',
  '当前模型不支持图生图，已自动切换为文生图组图': '이미지 편집을 지원하지 않아 텍스트 이미지 세트로 자동 전환했습니다.',
  '组图完成：已保存 {count} 张': '이미지 세트 완료: {count}장 저장',
  '上一张图片的组图任务已结束，请到相册查看已保存结果': '이전 이미지 세트 작업이 종료되었습니다. 저장 결과는 앨범에서 확인하세요.',
  '组图生成中断（已等待 {seconds} 秒）：{error}{saved}': '이미지 세트가 {seconds}초 후 중단됨: {error}{saved}',
  '；已保留并保存前 {count} 张。': '; 처음 {count}장을 보관하고 저장했습니다.',
  '已保存前 {count} 张，后续生成失败': '처음 {count}장은 저장했지만 이후 생성에 실패했습니다',
  '组图生成失败': '이미지 세트 생성 실패',
  '未找到相册作品': '앨범 항목을 찾을 수 없습니다',
  '这张图片还未保存到相册': '이 이미지는 아직 앨범에 저장되지 않았습니다',
  '保存授权失败：{error}': '동의를 저장하지 못했습니다: {error}',
  '初始化失败：{error}': '초기화 실패: {error}',
  '正在调用生图模型': '이미지 모델 호출 중',
  '正在保存到相册': '앨범에 저장 중',
  '正在编辑图片': '이미지 편집 중',
  '正在生成同款图片': '같은 스타일 이미지 생성 중',
  '正在生成': '생성 중',
  '正在打包 {count} 张图片…': '이미지 {count}장 패키징 중…',
  '为降低内存占用，将下载 {count} 个 ZIP 分包；请允许多文件下载': '메모리 사용을 줄이기 위해 ZIP {count}개를 다운로드합니다. 여러 파일 다운로드를 허용하세요.',
  '已删除 {count} 张图片': '이미지 {count}장을 삭제했습니다',
  '打开设置失败：{error}': '설정을 열 수 없습니다: {error}',
  '添加到角色库失败：{error}': '인물/사물 라이브러리에 추가하지 못했습니다: {error}',
  '尚未取得当前窗口信息，请稍后重试': '창 정보를 아직 가져오지 못했습니다. 잠시 후 다시 시도하세요.',
  '已在独立窗口中打开': '별도 창에서 열었습니다',
  '打开侧边栏失败：{error}': '사이드 패널을 열 수 없습니다: {error}',
  '请先填写 Base URL 和 API Key': '먼저 Base URL과 API Key를 입력하세요',
  '请输入新的模型名称': '새 모델 이름을 입력하세요'
});

Object.assign(EN, {
  '区域截图完成：{width}×{height}': 'Region captured: {width}×{height}',
  '区域截图失败：{error}': 'Region capture failed: {error}',
  '＋ 先添加角色或物品': '+ Add a person or object first',
  '未命名素材': 'Untitled asset',
  '再次点击查看大图': 'Click again to view full size',
  '选择 {name}': 'Select {name}',
  '素材': 'asset',
  '还没有素材，点击上方添加图片。': 'No assets yet. Add an image above.',
  '查看大图': 'View full size',
  '查看素材大图': 'View asset full size',
  '素材名称': 'Asset name',
  '删除': 'Delete',
  '新素材': 'New asset',
  '角色或物品素材': 'Person or object asset',
  '上一张图片的 {count} 张组图已完成并保存到相册': '{count} images for the previous source are complete and saved to the album',
  '上一张图片的组图已中断，已保留 {count} 张': 'The previous image set was interrupted; {count} image(s) were kept',
  '{count} 张主体锚定组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': '{count} identity-anchored images were generated and saved separately in {seconds}s.',
  '{count} 张文生图组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': '{count} text-to-image results were generated and saved separately in {seconds}s.',
  '设置失败': 'Settings failed',
  '网页魔法按钮已恢复': 'The web-page magic button is visible again',
  '已开启；请在普通网页图片上移动鼠标': 'Enabled. Move the pointer over an image on a regular web page.',
  '网页魔法按钮已隐藏': 'The web-page magic button is hidden',
  '确定删除选中的 {count} 张图片吗？此操作不可恢复。': 'Delete the selected {count} image(s)? This cannot be undone.',
  '已在侧边栏开始生成': 'Generation started in the side panel',
  '已发送到侧边栏处理': 'Sent to the side panel',
  '获取失败': 'Fetch failed',
  '获取失败：{error}': 'Fetch failed: {error}'
});

Object.assign(JA, {
  '区域截图完成：{width}×{height}': '範囲をキャプチャしました：{width}×{height}',
  '区域截图失败：{error}': '範囲キャプチャに失敗しました：{error}',
  '＋ 先添加角色或物品': '＋ 人物または物を追加',
  '未命名素材': '名称未設定の素材',
  '再次点击查看大图': 'もう一度クリックして拡大表示',
  '选择 {name}': '{name}を選択',
  '素材': '素材',
  '还没有素材，点击上方添加图片。': '素材がありません。上から画像を追加してください。',
  '查看大图': '拡大表示',
  '查看素材大图': '素材を拡大表示',
  '素材名称': '素材名',
  '删除': '削除',
  '新素材': '新しい素材',
  '角色或物品素材': '人物・物の素材',
  '上一张图片的 {count} 张组图已完成并保存到相册': '前の画像の{count}枚が完了し、アルバムに保存されました',
  '上一张图片的组图已中断，已保留 {count} 张': '前の画像セットが中断され、{count}枚を保持しました',
  '{count} 张主体锚定组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': '主体を固定した{count}枚を生成し、個別に保存しました（{seconds}秒）。',
  '{count} 张文生图组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': 'テキスト生成の{count}枚を個別に保存しました（{seconds}秒）。',
  '设置失败': '設定に失敗しました',
  '网页魔法按钮已恢复': 'Webページのマジックボタンを再表示しました',
  '已开启；请在普通网页图片上移动鼠标': '有効にしました。通常のWebページの画像にポインターを合わせてください。',
  '网页魔法按钮已隐藏': 'Webページのマジックボタンを非表示にしました',
  '确定删除选中的 {count} 张图片吗？此操作不可恢复。': '選択した{count}枚を削除しますか？元に戻せません。',
  '已在侧边栏开始生成': 'サイドパネルで生成を開始しました',
  '已发送到侧边栏处理': 'サイドパネルに送信しました',
  '获取失败': '取得に失敗しました',
  '获取失败：{error}': '取得に失敗しました：{error}'
});

Object.assign(KO, {
  '区域截图完成：{width}×{height}': '영역 캡처 완료: {width}×{height}',
  '区域截图失败：{error}': '영역 캡처 실패: {error}',
  '＋ 先添加角色或物品': '+ 먼저 인물 또는 사물 추가',
  '未命名素材': '이름 없는 소재',
  '再次点击查看大图': '다시 클릭하여 크게 보기',
  '选择 {name}': '{name} 선택',
  '素材': '소재',
  '还没有素材，点击上方添加图片。': '소재가 없습니다. 위에서 이미지를 추가하세요.',
  '查看大图': '크게 보기',
  '查看素材大图': '소재 크게 보기',
  '素材名称': '소재 이름',
  '删除': '삭제',
  '新素材': '새 소재',
  '角色或物品素材': '인물 또는 사물 소재',
  '上一张图片的 {count} 张组图已完成并保存到相册': '이전 원본의 이미지 {count}장이 완료되어 앨범에 저장되었습니다',
  '上一张图片的组图已中断，已保留 {count} 张': '이전 이미지 세트가 중단되어 {count}장을 보관했습니다',
  '{count} 张主体锚定组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': '주체를 고정한 이미지 {count}장을 생성해 각각 저장했습니다. {seconds}초 소요.',
  '{count} 张文生图组图已全部生成，并分别保存到相册；用时 {seconds} 秒。': '텍스트 이미지 {count}장을 생성해 각각 저장했습니다. {seconds}초 소요.',
  '设置失败': '설정 실패',
  '网页魔法按钮已恢复': '웹페이지 매직 버튼을 다시 표시했습니다',
  '已开启；请在普通网页图片上移动鼠标': '활성화했습니다. 일반 웹페이지 이미지 위로 포인터를 이동하세요.',
  '网页魔法按钮已隐藏': '웹페이지 매직 버튼을 숨겼습니다',
  '确定删除选中的 {count} 张图片吗？此操作不可恢复。': '선택한 이미지 {count}장을 삭제할까요? 되돌릴 수 없습니다.',
  '已在侧边栏开始生成': '사이드 패널에서 생성을 시작했습니다',
  '已发送到侧边栏处理': '사이드 패널로 보냈습니다',
  '获取失败': '가져오기 실패',
  '获取失败：{error}': '가져오기 실패: {error}'
});

Object.assign(EN, {
  '自定义平台': 'Custom Platform',
  '自定义（OpenAI 兼容接口）': 'Custom (OpenAI-compatible API)',
  '尚未添加接口': 'No API configured',
  '从右上角选择模板或自定义接口': 'Choose a provider template or Custom API above.',
  '选择内置接口或输入 {url}': 'Choose a built-in API or enter {url}',
  '前往 {platform} 获取 API Key': 'Get an API key from {platform}',
  '前往 {platform} 获取 API Key（推广链接）': 'Get an API key from {platform} (referral link)'
});

Object.assign(JA, {
  '自定义平台': 'カスタムプラットフォーム',
  '自定义（OpenAI 兼容接口）': 'カスタム（OpenAI互換API）',
  '接口，也可以手动添加模型。': 'エンドポイントに対応し、モデルを手動で追加することもできます。',
  '适用于 GPT Image 等支持 Quality 的模型': 'GPT ImageなどQuality設定に対応するモデル向け',
  'Low（默认）': 'Low（デフォルト）',
  '适用于支持 1k / 2k / 4k 的模型': '1K / 2K / 4Kに対応するモデル向け',
  '1K（默认）': '1K（デフォルト）',
  '尚未添加接口': 'APIが設定されていません',
  '从右上角选择模板或自定义接口': '上からサービスのテンプレートまたはカスタムAPIを選択してください。',
  '选择内置接口或输入 {url}': '組み込みAPIを選択するか、{url} を入力',
  '前往 {platform} 获取 API Key': '{platform}でAPIキーを取得',
  '前往 {platform} 获取 API Key（推广链接）': '{platform}でAPIキーを取得（紹介リンク）'
});

Object.assign(KO, {
  '自定义平台': '사용자 지정 플랫폼',
  '自定义（OpenAI 兼容接口）': '사용자 지정(OpenAI 호환 API)',
  '接口，也可以手动添加模型。': '엔드포인트를 지원하며 모델을 직접 추가할 수도 있습니다.',
  '适用于 GPT Image 等支持 Quality 的模型': 'GPT Image 등 Quality 설정을 지원하는 모델용',
  'Low（默认）': 'Low(기본값)',
  '适用于支持 1k / 2k / 4k 的模型': '1K / 2K / 4K를 지원하는 모델용',
  '1K（默认）': '1K(기본값)',
  '尚未添加接口': '설정된 API가 없습니다',
  '从右上角选择模板或自定义接口': '위에서 플랫폼 템플릿 또는 사용자 지정 API를 선택하세요.',
  '选择内置接口或输入 {url}': '기본 제공 API를 선택하거나 {url} 입력',
  '前往 {platform} 获取 API Key': '{platform}에서 API 키 받기',
  '前往 {platform} 获取 API Key（推广链接）': '{platform}에서 API 키 받기(추천 링크)'
});

Object.assign(EN, {
  '④ 配置备份': '④ Configuration Backup',
  '导出或导入平台、模型、比例、语言和其他生成设置，方便重装插件或更换设备。': 'Export or import providers, models, aspect ratios, language, and other generation settings for easy reinstall or device migration.',
  '导出文件包含 API Key，请妥善保管，不要公开分享。': 'The exported file contains API keys. Keep it secure and do not share it publicly.',
  '导出配置': 'Export Settings',
  '导入配置': 'Import Settings',
  '配置已导出，请妥善保管其中的 API Key': 'Settings exported. Keep the included API keys secure.',
  '导入配置将覆盖当前设置，是否继续？': 'Importing will overwrite your current settings. Continue?',
  '配置导入成功': 'Settings imported successfully',
  '导入失败：{error}': 'Import failed: {error}',
  '配置文件格式无效': 'Invalid settings file format',
  '不是 EchoShot · 拍同款配置文件': 'This is not an EchoShot · 拍同款 settings file',
  '配置文件缺少平台或默认模型信息': 'The settings file is missing provider or default model data',
  '配置文件过大': 'The settings file is too large',
  '配置文件不是有效的 JSON': 'The settings file is not valid JSON',
  '全部下载': 'Download All',
  '下载整个相册（共 {count} 张）': 'Download Entire Gallery ({count} images)',
  '正在打包…': 'Packaging…',
  '相册中没有可下载的图片': 'There are no images to download',
  '正在打包第 {current}/{total} 个 ZIP…': 'Packaging ZIP {current} of {total}…',
  '读取相册图片失败': 'Could not read gallery images',
  '全部图片已开始下载': 'All image downloads have started',
  '全部下载失败：{error}': 'Download all failed: {error}'
  , '正在准备下载…': 'Preparing download…'
  , '取消下载': 'Cancel Download'
  , '正在打包第 {current}/{total} 张图片…': 'Packaging image {current} of {total}…'
  , '正在准备 {total} 张图片…': 'Preparing {total} images…'
  , '请选择 ZIP 文件的保存位置…': 'Choose where to save the ZIP file…'
  , '已完成 {total} 张图片的打包': 'Finished packaging {total} images'
  , '全部图片已保存到一个 ZIP 文件': 'All images were saved in one ZIP file'
  , '已取消下载': 'Download cancelled'
  , '无法打开保存窗口：{error}': 'Could not open the save dialog: {error}'
  , '正在取消…': 'Cancelling…'
  , '正在取消下载…': 'Cancelling download…'
  , 'ZIP 文件超过 4GB，请减少相册图片后重试': 'The ZIP would exceed 4 GB. Reduce the gallery size and try again.'
  , 'ZIP 文件数量超过 65535 个': 'A ZIP cannot contain more than 65,535 files.'
});

Object.assign(JA, {
  '④ 配置备份': '④ 設定のバックアップ',
  '导出或导入平台、模型、比例、语言和其他生成设置，方便重装插件或更换设备。': 'サービス、モデル、比率、言語などの生成設定をエクスポート／インポートし、再インストールや端末移行に利用できます。',
  '导出文件包含 API Key，请妥善保管，不要公开分享。': 'エクスポートファイルにはAPIキーが含まれます。安全に保管し、公開しないでください。',
  '导出配置': '設定を書き出す',
  '导入配置': '設定を読み込む',
  '配置已导出，请妥善保管其中的 API Key': '設定を書き出しました。含まれるAPIキーを安全に保管してください。',
  '导入配置将覆盖当前设置，是否继续？': '読み込むと現在の設定が上書きされます。続行しますか？',
  '配置导入成功': '設定を読み込みました',
  '导入失败：{error}': '読み込みに失敗しました：{error}',
  '配置文件格式无效': '設定ファイルの形式が正しくありません',
  '不是 EchoShot · 拍同款配置文件': 'EchoShot · 拍同款 の設定ファイルではありません',
  '配置文件缺少平台或默认模型信息': 'サービスまたは既定モデルの情報がありません',
  '配置文件过大': '設定ファイルが大きすぎます',
  '配置文件不是有效的 JSON': '設定ファイルは有効なJSONではありません',
  '全部下载': 'すべてダウンロード',
  '下载整个相册（共 {count} 张）': 'アルバム全体をダウンロード（{count}枚）',
  '正在打包…': 'パッケージ中…',
  '相册中没有可下载的图片': 'ダウンロードできる画像がありません',
  '正在打包第 {current}/{total} 个 ZIP…': 'ZIPをパッケージ中 {current}/{total}…',
  '读取相册图片失败': 'アルバム画像を読み込めませんでした',
  '全部图片已开始下载': 'すべての画像のダウンロードを開始しました',
  '全部下载失败：{error}': '一括ダウンロードに失敗しました：{error}'
  , '正在准备下载…': 'ダウンロードを準備中…'
  , '取消下载': 'ダウンロードを中止'
  , '正在打包第 {current}/{total} 张图片…': '{current}/{total}枚目をパッケージ中…'
  , '正在准备 {total} 张图片…': '{total}枚の画像を準備中…'
  , '请选择 ZIP 文件的保存位置…': 'ZIPファイルの保存先を選択してください…'
  , '已完成 {total} 张图片的打包': '{total}枚のパッケージが完了しました'
  , '全部图片已保存到一个 ZIP 文件': 'すべての画像を1つのZIPファイルに保存しました'
  , '已取消下载': 'ダウンロードを中止しました'
  , '无法打开保存窗口：{error}': '保存画面を開けません：{error}'
  , '正在取消…': '中止しています…'
  , '正在取消下载…': 'ダウンロードを中止しています…'
  , 'ZIP 文件超过 4GB，请减少相册图片后重试': 'ZIPが4GBを超えます。アルバムの画像を減らして再試行してください。'
  , 'ZIP 文件数量超过 65535 个': '1つのZIPに保存できるファイルは65,535個までです。'
});

Object.assign(KO, {
  '④ 配置备份': '④ 설정 백업',
  '导出或导入平台、模型、比例、语言和其他生成设置，方便重装插件或更换设备。': '플랫폼, 모델, 비율, 언어 및 기타 생성 설정을 내보내거나 가져와 재설치와 기기 이전에 사용할 수 있습니다.',
  '导出文件包含 API Key，请妥善保管，不要公开分享。': '내보낸 파일에는 API 키가 포함됩니다. 안전하게 보관하고 공개적으로 공유하지 마세요.',
  '导出配置': '설정 내보내기',
  '导入配置': '설정 가져오기',
  '配置已导出，请妥善保管其中的 API Key': '설정을 내보냈습니다. 포함된 API 키를 안전하게 보관하세요.',
  '导入配置将覆盖当前设置，是否继续？': '가져오면 현재 설정을 덮어씁니다. 계속할까요?',
  '配置导入成功': '설정을 가져왔습니다',
  '导入失败：{error}': '가져오기 실패: {error}',
  '配置文件格式无效': '설정 파일 형식이 올바르지 않습니다',
  '不是 EchoShot · 拍同款配置文件': 'EchoShot · 拍同款 설정 파일이 아닙니다',
  '配置文件缺少平台或默认模型信息': '설정 파일에 플랫폼 또는 기본 모델 정보가 없습니다',
  '配置文件过大': '설정 파일이 너무 큽니다',
  '配置文件不是有效的 JSON': '설정 파일이 올바른 JSON이 아닙니다',
  '全部下载': '모두 다운로드',
  '下载整个相册（共 {count} 张）': '전체 앨범 다운로드({count}장)',
  '正在打包…': '패키징 중…',
  '相册中没有可下载的图片': '다운로드할 이미지가 없습니다',
  '正在打包第 {current}/{total} 个 ZIP…': 'ZIP 패키징 중 {current}/{total}…',
  '读取相册图片失败': '앨범 이미지를 읽지 못했습니다',
  '全部图片已开始下载': '모든 이미지 다운로드를 시작했습니다',
  '全部下载失败：{error}': '전체 다운로드 실패: {error}'
  , '正在准备下载…': '다운로드 준비 중…'
  , '取消下载': '다운로드 취소'
  , '正在打包第 {current}/{total} 张图片…': '이미지 패키징 중 {current}/{total}…'
  , '正在准备 {total} 张图片…': '이미지 {total}장 준비 중…'
  , '请选择 ZIP 文件的保存位置…': 'ZIP 파일을 저장할 위치를 선택하세요…'
  , '已完成 {total} 张图片的打包': '이미지 {total}장 패키징 완료'
  , '全部图片已保存到一个 ZIP 文件': '모든 이미지를 하나의 ZIP 파일로 저장했습니다'
  , '已取消下载': '다운로드를 취소했습니다'
  , '无法打开保存窗口：{error}': '저장 창을 열 수 없습니다: {error}'
  , '正在取消…': '취소 중…'
  , '正在取消下载…': '다운로드 취소 중…'
  , 'ZIP 文件超过 4GB，请减少相册图片后重试': 'ZIP 파일이 4GB를 초과합니다. 앨범 이미지를 줄인 후 다시 시도하세요.'
  , 'ZIP 文件数量超过 65535 个': '하나의 ZIP에는 최대 65,535개의 파일을 저장할 수 있습니다.'
});

Object.assign(EN, {
  '正在后台生成 1 个任务，已等待 {seconds} 秒…': '1 image task is running in the background — {seconds}s elapsed…',
  '正在后台生成 {count} 个任务，最长已等待 {seconds} 秒…': '{count} image tasks are running in the background — longest wait {seconds}s…',
  '当前正在执行组图或替换任务，请等待完成': 'An image-set or replacement task is running. Wait for it to finish.',
  '后台生成任务已完成，结果已保存到相册': 'The background image task is complete and saved to the gallery.',
  '生成完成，已保存到相册': 'Generation complete and saved to the gallery.',
  '同时最多运行 4 个单张生图任务，请等待其中一个完成': 'Up to 4 single-image tasks can run at once. Wait for one to finish.',
  '请等待单张生图任务完成后再开始组图或替换任务': 'Wait for the single-image tasks to finish before starting an image set or replacement.'
});

Object.assign(JA, {
  '正在后台生成 1 个任务，已等待 {seconds} 秒…': 'バックグラウンドで1件を生成中 · {seconds}秒経過…',
  '正在后台生成 {count} 个任务，最长已等待 {seconds} 秒…': 'バックグラウンドで{count}件を生成中 · 最長{seconds}秒経過…',
  '当前正在执行组图或替换任务，请等待完成': '画像セットまたは置換タスクの実行中です。完了までお待ちください。',
  '后台生成任务已完成，结果已保存到相册': 'バックグラウンド生成が完了し、アルバムに保存されました。',
  '生成完成，已保存到相册': '生成が完了し、アルバムに保存されました。',
  '同时最多运行 4 个单张生图任务，请等待其中一个完成': '単画像タスクは同時に4件まで実行できます。いずれかの完了をお待ちください。',
  '请等待单张生图任务完成后再开始组图或替换任务': '単画像タスクの完了後に、画像セットまたは置換タスクを開始してください。'
});

Object.assign(KO, {
  '正在后台生成 1 个任务，已等待 {seconds} 秒…': '백그라운드에서 이미지 작업 1개 생성 중 · {seconds}초 경과…',
  '正在后台生成 {count} 个任务，最长已等待 {seconds} 秒…': '백그라운드에서 이미지 작업 {count}개 생성 중 · 최장 {seconds}초 경과…',
  '当前正在执行组图或替换任务，请等待完成': '이미지 세트 또는 교체 작업이 실행 중입니다. 완료될 때까지 기다려 주세요.',
  '后台生成任务已完成，结果已保存到相册': '백그라운드 생성이 완료되어 앨범에 저장되었습니다.',
  '生成完成，已保存到相册': '생성이 완료되어 앨범에 저장되었습니다.',
  '同时最多运行 4 个单张生图任务，请等待其中一个完成': '단일 이미지 작업은 동시에 최대 4개까지 실행할 수 있습니다. 하나가 완료될 때까지 기다려 주세요.',
  '请等待单张生图任务完成后再开始组图或替换任务': '단일 이미지 작업이 완료된 후 이미지 세트 또는 교체 작업을 시작하세요.'
});

Object.assign(EN, {
  '模型别名（可选）': 'Model alias (optional)',
  '为 {model} 设置别名': 'Set an alias for {model}',
  '模型名称、别名与启用能力': 'Models, Aliases & Capabilities'
});
Object.assign(JA, {
  '模型别名（可选）': 'モデルの別名（任意）',
  '为 {model} 设置别名': '{model} の別名を設定',
  '模型名称、别名与启用能力': 'モデル・別名・機能'
});
Object.assign(KO, {
  '模型别名（可选）': '모델 별칭(선택 사항)',
  '为 {model} 设置别名': '{model}의 별칭 설정',
  '模型名称、别名与启用能力': '모델, 별칭 및 기능'
});

Object.assign(EN, {
  '拖放图片到这里': 'Drop the image here',
  '先读取提示词；没有时再调用反推模型': 'Read the embedded prompt first; analyze only if none is found',
  '也可以把本地图片拖入侧边栏；有兼容的生成提示词时直接读取，没有时再进行反推。': 'You can also drag a local image into the side panel. A compatible embedded generation prompt is read locally; otherwise the image is analyzed.',
  '当你点击反推、拖入不含可识别生成提示词的图片、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': 'When you reverse, drop an image without a recognized generation prompt, generate, replace a subject, or create a set, the required images, references, and prompts are sent to your chosen AI provider for that task.',
  '✓ 已读取图片中的提示词，可直接编辑': '✓ Embedded prompt read — you can edit it',
  '正在读取图片元数据…': 'Reading image metadata…',
  '请先同意数据使用方式': 'Agree to the data handling terms first',
  '来自拖入的本地图片': 'Local image dropped into the side panel',
  '已读取图片中的提示词': 'Embedded prompt read from image',
  '已从 {source} 元数据读取提示词': 'Prompt read from {source} metadata',
  '元数据': 'Metadata',
  '元数据：{source}': 'Metadata: {source}',
  '图片没有可识别的生成提示词，正在反推': 'No recognized generation prompt found; analyzing the image',
  '只支持拖入图片文件': 'Only image files can be dropped here',
  '图片读取失败：{error}': 'Could not read image: {error}',
  '当前图片格式不支持嵌入生成信息': 'This image format does not support embedded generation metadata',
  '下载失败：{error}': 'Download failed: {error}',
  '原模型当前未启用，将使用当前生图模型重新生成': 'The original model is not enabled. Regenerating with the current image model.',
  '更新日期：2026 年 8 月 6 日': 'Updated: August 6, 2026',
  '只有当用户点击反推、主动将不含可识别生成提示词的图片拖入侧边栏、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。读取图片内嵌的兼容生成提示词只在本机完成，不会因此发送图片。': 'Only when the user starts prompt analysis, drops an image without a recognized generation prompt into the side panel, generates, replaces a subject, or creates an image set does the extension send the data required for that task to the selected AI provider. Reading compatible embedded generation prompts happens locally and does not send the image.'
});
Object.assign(JA, {
  '拖放图片到这里': 'ここに画像をドロップ',
  '先读取提示词；没有时再调用反推模型': '埋め込みプロンプトを先に読み、ない場合のみ解析します',
  '也可以把本地图片拖入侧边栏；有兼容的生成提示词时直接读取，没有时再进行反推。': 'ローカル画像をサイドパネルにドロップできます。互換性のある生成プロンプトがあればローカルで読み取り、なければ画像を解析します。',
  '当你点击反推、拖入不含可识别生成提示词的图片、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': '解析、認識可能な生成プロンプトのない画像のドロップ、生成、置換、画像セット作成を実行すると、必要な画像・参照素材・プロンプトが選択したAIサービスへ送信されます。',
  '✓ 已读取图片中的提示词，可直接编辑': '✓ 埋め込みプロンプトを読み取りました・編集できます',
  '正在读取图片元数据…': '画像メタデータを読み取り中…',
  '请先同意数据使用方式': '先にデータの利用方法へ同意してください',
  '来自拖入的本地图片': 'ドロップしたローカル画像',
  '已读取图片中的提示词': '画像内のプロンプトを読み取りました',
  '已从 {source} 元数据读取提示词': '{source}メタデータからプロンプトを読み取りました',
  '元数据': 'メタデータ',
  '元数据：{source}': 'メタデータ：{source}',
  '图片没有可识别的生成提示词，正在反推': '認識可能な生成プロンプトがないため画像を解析しています',
  '只支持拖入图片文件': '画像ファイルのみドロップできます',
  '图片读取失败：{error}': '画像を読み取れません：{error}',
  '当前图片格式不支持嵌入生成信息': 'この画像形式は生成情報の埋め込みに対応していません',
  '下载失败：{error}': 'ダウンロードに失敗しました：{error}',
  '在相册中查看这张生成图片的大图': 'この生成画像をアルバムで拡大表示',
  '原模型当前未启用，将使用当前生图模型重新生成': '元のモデルが有効でないため、現在の画像モデルで再生成します',
  '更新日期：2026 年 8 月 6 日': '更新日：2026年8月6日',
  '只有当用户点击反推、主动将不含可识别生成提示词的图片拖入侧边栏、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。读取图片内嵌的兼容生成提示词只在本机完成，不会因此发送图片。': '解析、認識可能な生成プロンプトのない画像のドロップ、生成、置換、画像セット作成を実行した場合のみ、必要なデータを選択したAIサービスへ送信します。互換性のある埋め込み生成プロンプトの読み取りはローカルで完結し、画像は送信されません。'
});
Object.assign(KO, {
  '拖放图片到这里': '여기에 이미지를 놓으세요',
  '先读取提示词；没有时再调用反推模型': '내장 프롬프트를 먼저 읽고, 없을 때만 분석합니다',
  '也可以把本地图片拖入侧边栏；有兼容的生成提示词时直接读取，没有时再进行反推。': '로컬 이미지를 사이드 패널로 끌어올 수 있습니다. 호환되는 생성 프롬프트가 있으면 로컬에서 읽고, 없으면 이미지를 분석합니다.',
  '当你点击反推、拖入不含可识别生成提示词的图片、生成、角色替换或组图生成时，所选来源图、参考素材和提示词会发送到你选择的 AI 平台，用于完成本次任务。': '분석, 인식 가능한 생성 프롬프트가 없는 이미지 드롭, 생성, 교체 또는 이미지 세트 작업을 실행하면 필요한 이미지, 참고 소재 및 프롬프트가 선택한 AI 플랫폼으로 전송됩니다.',
  '✓ 已读取图片中的提示词，可直接编辑': '✓ 내장 프롬프트를 읽었습니다 · 편집할 수 있습니다',
  '正在读取图片元数据…': '이미지 메타데이터 읽는 중…',
  '请先同意数据使用方式': '먼저 데이터 처리 방식에 동의하세요',
  '来自拖入的本地图片': '사이드 패널로 끌어온 로컬 이미지',
  '已读取图片中的提示词': '이미지에서 내장 프롬프트를 읽었습니다',
  '已从 {source} 元数据读取提示词': '{source} 메타데이터에서 프롬프트를 읽었습니다',
  '元数据': '메타데이터',
  '元数据：{source}': '메타데이터: {source}',
  '图片没有可识别的生成提示词，正在反推': '인식 가능한 생성 프롬프트가 없어 이미지를 분석합니다',
  '只支持拖入图片文件': '이미지 파일만 놓을 수 있습니다',
  '图片读取失败：{error}': '이미지를 읽지 못했습니다: {error}',
  '当前图片格式不支持嵌入生成信息': '이 이미지 형식은 생성 정보 내장을 지원하지 않습니다',
  '下载失败：{error}': '다운로드 실패: {error}',
  '在相册中查看这张生成图片的大图': '이 생성 이미지를 앨범에서 크게 보기',
  '原模型当前未启用，将使用当前生图模型重新生成': '원래 모델이 활성화되어 있지 않아 현재 이미지 모델로 다시 생성합니다',
  '更新日期：2026 年 8 月 6 日': '업데이트: 2026년 8월 6일',
  '只有当用户点击反推、主动将不含可识别生成提示词的图片拖入侧边栏、生成、替换角色或组图生成时，扩展才会将完成任务所必需的来源图、参考素材和提示词发送到用户选定的 AI 平台。读取图片内嵌的兼容生成提示词只在本机完成，不会因此发送图片。': '분석, 인식 가능한 생성 프롬프트가 없는 이미지 드롭, 생성, 교체 또는 이미지 세트 작업을 시작할 때만 필요한 데이터를 선택한 AI 플랫폼으로 전송합니다. 호환되는 내장 생성 프롬프트 읽기는 로컬에서만 처리되며 이미지를 전송하지 않습니다.'
});

const DICTIONARIES = { zh: {}, en: EN, ja: JA, ko: KO };
const originalText = new WeakMap();
const originalAttrs = new WeakMap();

export function resolveLanguage(preference = 'auto', languages = globalThis.navigator?.languages || [globalThis.navigator?.language]) {
  if (SUPPORTED_LANGUAGES.includes(preference)) return preference;
  for (const candidate of languages || []) {
    const base = String(candidate || '').toLowerCase().split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(base)) return base;
  }
  return 'en';
}

export function explanationLanguage(language) {
  return language === 'zh' || language === 'ja' || language === 'ko' ? language : '';
}

export function explanationLabel(language) {
  return language === 'ja' ? t('日语解读', {}, language) : language === 'ko' ? t('韩语解读', {}, language) : t('中文解读', {}, language);
}

export function t(key, vars = {}, language = document.documentElement.dataset.language || 'zh') {
  let value = DICTIONARIES[language]?.[key] || key;
  for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}

export function localizeRuntimeError(error, language = document.documentElement.dataset.language || 'zh') {
  const raw = String(error?.message || error || '').trim();
  if (!raw) return t('未知错误', {}, language);
  const normalized = [
    {
      pattern: /Receiving end does not exist|Could not establish connection/i,
      key: '扩展尚未连接当前网页，请刷新页面后重试'
    },
    {
      pattern: /activeTab permission|permission.*(?:capture|active tab)|active tab.*permission/i,
      key: '当前页面截图权限不可用，请返回网页后重新点击框选截图'
    },
    {
      pattern: /Cannot access contents of url|Cannot access a (?:chrome|edge):\/\/|extensions gallery cannot be scripted|当前页面不允许加载网页按钮/i,
      key: '当前页面不允许扩展运行，请在普通 HTTP/HTTPS 网页中使用'
    }
  ].find(({ pattern }) => pattern.test(raw));
  return t(normalized?.key || raw, {}, language);
}

function translateTextNode(node, language) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  const source = originalText.get(node);
  const trimmed = source.trim();
  if (!trimmed) return;
  const translated = t(trimmed, {}, language);
  node.nodeValue = source.replace(trimmed, translated);
}

export function localizeDocument(language, root = document) {
  const resolved = resolveLanguage(language, [language]);
  document.documentElement.lang = resolved === 'zh' ? 'zh-CN' : resolved;
  document.documentElement.dataset.language = resolved;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script, style, code')) continue;
    translateTextNode(node, resolved);
  }
  const elements = root.querySelectorAll?.('[title], [aria-label], [placeholder], [data-tooltip]') || [];
  for (const element of elements) {
    if (!originalAttrs.has(element)) originalAttrs.set(element, {});
    const sources = originalAttrs.get(element);
    for (const attr of ['title', 'aria-label', 'placeholder', 'data-tooltip']) {
      if (!element.hasAttribute(attr)) continue;
      if (!(attr in sources)) sources[attr] = element.getAttribute(attr);
      element.setAttribute(attr, t(sources[attr], {}, resolved));
    }
  }
  return resolved;
}

export async function getStoredLanguage() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return resolveLanguage(settings.language || 'auto');
}

export async function initLocalizedPage() {
  const language = await getStoredLanguage();
  localizeDocument(language);
  return language;
}
