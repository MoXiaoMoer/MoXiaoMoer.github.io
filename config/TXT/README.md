```markdown
本目录为文章 TXT 文件的存放位置。
每篇文章按规则保存为：文章ID_标题.txt
文件内容包含：
- 标题
- 分类
- 发布时间
- 阅读量
- 摘要
- 正文（Markdown 或 HTML）

注意：
- 浏览器安全限制：静态页面无法直接写入仓库文件（GitHub Pages 环境也是只读的）。
- 本实现提供两种写入方案：
  1) 如果浏览器支持 File System Access API（如 Chromium 系浏览器），在后台点击“选择保存目录 (File System API)”并授权后，系统会尝试在你授权的本地目录下创建 config/TXT/ 文件并写入；
  2) 否则，保存操作会将单个文章以 .txt 文件形式下载到本地（文件名带 config/TXT/ 前缀以便用户手动整理）。
- 同时，文章会保存在浏览器 localStorage（键名 xm_posts），前台与后台从 localStorage 读取并展示文章。