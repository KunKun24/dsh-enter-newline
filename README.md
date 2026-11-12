# dsh-enter-newline

[English](README.en.md) · DeepSeek Harness 插件 · MIT

让 DeepSeek Harness 的聊天输入框「Enter 换行、不发送」。

按 Enter 只插入一个换行，发送请点发送按钮；`Shift+Enter` 行为不变，中文输入法
组合过程中按 Enter 不会被拦截。

## 为什么需要它

dsh 默认 Enter 直接发送，长提示词写到一半按 Enter 就飞出去了。

## 实现要点（踩过的坑）

dsh 的输入框是 **Lexical 富文本编辑器**，内容由它自己的数据模型管理。
早期版本用 `document.execCommand('insertLineBreak')` 直接改 DOM，会绕过模型，
Lexical 下一次 reconcile 时把 DOM 重置回模型内容，**粘贴进去的文字会被一起冲掉**。

现在的做法是：只把真实键盘事件的 `shiftKey` 改写为 `true`，交给 Lexical 自己处理。

- Lexical 判定为 `Shift+Enter`，走 `INSERT_LINE_BREAK_COMMAND`
- dsh 的提交处理器里有一句 `if (event.shiftKey === true) return false`

两条都成立，所以既不发送，也不破坏编辑器状态。全程不碰 DOM。

## 配置

侧边栏「换行设置」里可以开关，设置存在本机 `localStorage: dsh-enter-newline`。

## 兼容性

- 只作用于 `[data-lexical-editor]` 且位于 composer 内的输入框
- 会话改名、设置页等其他输入框不受影响

## 安装

### 方式一：插件市场（推荐）

在 dsh 的「插件市场」里搜索包名直接安装。

### 方式二：Release 压缩包

```bash
dsh plugin --profile web add ./dsh-enter-newline-1.0.0.tgz
```

### 方式三：手动装到 profile

```bash
# 1. 复制到 profile 的 vendor 目录
cp -r dsh-enter-newline ~/.dsh/profiles/web/vendor/dsh-enter-newline

# 2. 在 profile 的 package.json 里加一条依赖（file: 指向 vendor）
#    "dependencies": { "dsh-enter-newline": "file:./vendor/dsh-enter-newline" }

# 3. 装依赖并重启
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

## 卸载

从 `package.json` 的 `dependencies` 和 `dsh.profile.bundles` 里删掉 `dsh-enter-newline`，
再 `pnpm install` 重启即可；插件本身不写任何业务数据。

## 许可证

MIT

---

## 关于 AIGC

> 项目包含 AIGC 内容，AI 减少了开发时间；我们也认真审核了每一条代码。
