# dsh-enter-newline

[中文](README.md) · DeepSeek Harness plugin · MIT

Press Enter inserts a newline instead of sending the message.

## What it does

In the chat composer, `Enter` inserts a line break and does **not** send; use the
send button to submit. `Shift+Enter` keeps its default behaviour, and Enter is
never swallowed while an IME composition is in progress.

Only the composer is affected — session renaming, settings fields and every other
input in the UI keep the default Enter behaviour.

## Why

DeepSeek Harness sends on Enter by default. Half-written long prompts used to fly
off mid-sentence.

## How it works

The composer is a Lexical rich-text editor. Rewriting the DOM directly (for
example with `execCommand`) is reverted by Lexical on its next reconcile and can
wipe pasted text.

Instead the plugin catches the real `keydown` event in the capture phase and
redefines its `shiftKey` getter to `true`:

- Lexical reads it as `Shift+Enter` and runs `INSERT_LINE_BREAK_COMMAND`
- the Harness submit handler has `if (event.shiftKey === true) return false`

The event is never re-dispatched, so nothing can loop, and the editor model stays
consistent.

## Settings

Sidebar → "换行设置" (Line break). The switch is stored in this browser only, in
`localStorage["dsh-enter-newline"]`.

## Install

### Plugin marketplace

Search for `dsh-enter-newline` in the Harness plugin marketplace and install it.

### Release tarball

```bash
dsh plugin --profile web add ./dsh-enter-newline-1.0.0.tgz
```

### Manual

```bash
cp -r dsh-enter-newline ~/.dsh/profiles/web/vendor/
# add to ~/.dsh/profiles/web/package.json
#   "dependencies": { "dsh-enter-newline": "file:./vendor/dsh-enter-newline" }
cd ~/.dsh/profiles/web && pnpm install && dsh web
```

Restart the instance after installing: client bundle URLs carry a content hash,
so an open tab would keep the old module.

## Uninstall

Remove `dsh-enter-newline` from `dsh.profile.bundles` and from `dependencies`,
run `pnpm install`, then restart. No data is left behind.

## License

MIT © 2026 困困
