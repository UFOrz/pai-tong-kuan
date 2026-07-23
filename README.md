# 拍同款（Pai Tong Kuan）

拍同款是一款基于 Chrome Manifest V3 的浏览器扩展。用户可以从网页图片或框选截图中反推生图提示词，生成同款图片，并在本机相册中管理结果。

本仓库只公开实际发布到浏览器扩展商店的软件包内容，以及开源所必需的说明和许可证；内部备份、商店审核材料、历史安装包和开发过程文件不包含在本仓库中。

## 主要功能

- 悬停网页图片，点击魔法按钮反推提示词
- 框选当前页面可见区域作为来源图片
- 支持中文、English、日本語和한국어界面
- 支持多平台、多反推模型和多生图模型配置
- 支持同款生成、组图生成以及角色或物品替换
- 本地角色与物品素材库
- 本地相册、搜索、大图切换和原图对比
- 用户自行配置 API Key（BYOK）

## 支持的平台

内置配置包括 OpenAI、ModelScope、SiliconFlow、Agnes-AI、ZenMux、RunningHUB 和 AtlasCloud。用户也可以添加兼容接口。

不同平台和模型的功能、额度、价格、可用地区及接口行为由相应服务商决定。

## 安装源码版本

要求 Chrome 116 或兼容的 Microsoft Edge 版本。

1. 下载本仓库源码或对应版本的 Release ZIP。
2. 如果下载的是 ZIP，请先解压。
3. 打开 `chrome://extensions/` 或 `edge://extensions/`。
4. 开启“开发者模式”。
5. 点击“加载已解压的扩展程序”，选择包含 `manifest.json` 的目录。
6. 打开扩展设置页，配置自己的平台 API Key 和模型。

正式使用时，建议优先安装 Chrome Web Store 或 Microsoft Edge Add-ons 发布的审核版本。

## 隐私与数据

- API Key 保存在浏览器扩展的本地存储中。
- 来源图、提示词、参考素材和生成结果保存在本机。
- 只有在用户主动发起任务时，完成任务所需的数据才会发送到用户选定的 AI 平台。
- 扩展开发者不运营 API 中转服务器。
- 扩展不加载或执行远程 JavaScript。

完整说明见 [PRIVACY.md](PRIVACY.md)。

## 推广链接披露

设置页中的部分 `Get Key` 链接属于 AI 平台邀请或推广链接。只有用户主动点击后才会打开；开发者可能获得平台提供的推广奖励，但不会因此提高用户的使用价格。扩展不会自动跳转、替换网页链接、写入推广 Cookie，也不会跟踪用户是否注册或购买。用户也可以直接访问各平台官网注册。

## 权限说明

- `storage`：保存平台配置、API Key、任务状态和界面设置。
- `sidePanel`：提供主要创作工作流。
- `contextMenus`：提供网页图片右键入口。
- `scripting`：在用户主动操作时执行选图和框选截图功能。
- `<all_urls>`：识别用户主动选择的网页图片，并访问用户配置的 AI API 地址。

## 开源范围

公开源码与商店发布包中的运行代码保持一致。本仓库不包含真实 API Key、审核临时密钥或用户数据。

## 许可证

本项目采用 [GNU Affero General Public License v3.0（AGPL-3.0）](LICENSE)。如果分发修改版本，或通过网络向用户提供修改版本的功能，请按照许可证要求提供对应源代码。

---

## English

Pai Tong Kuan is a Chrome Manifest V3 extension for reconstructing image-generation prompts from user-selected web images or captured page regions, generating matching images, replacing characters or objects, and managing results in a local gallery.

Users provide their own API keys. Source images, prompts, reference assets, and generated results are stored locally, except when the user explicitly starts a task that sends the required data to the selected AI provider.

This public repository mirrors the files shipped in the browser extension package, plus the README and AGPL-3.0 license. Internal backups, review materials, historical packages, credentials, and user data are not included.

## License

Copyright © 2026 UFOrz. Licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).
