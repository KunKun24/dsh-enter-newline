window.__ModuleLoader__.load({
  id: 'dsh-enter-newline',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const NS = 'dsh-enter-newline';
    const STORAGE_KEY = 'dsh-enter-newline';

    const MUTED = 'var(--dsw-alias-text-secondary, #8b93a7)';
    const LINE = 'var(--dsw-alias-border-secondary, rgba(128,128,128,.22))';

    function readSettings() {
      let raw = null;
      try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (error) { raw = null; }
      let value = {};
      if (raw) { try { value = JSON.parse(raw) || {}; } catch (error) { value = {}; } }
      return { enabled: value.enabled !== false };
    }

    let settings = readSettings();
    const listeners = new Set();

    function updateSettings(patch) {
      settings = Object.assign({}, settings, patch);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (error) {}
      listeners.forEach((fn) => { try { fn(settings); } catch (error) {} });
    }

    function isComposerEditor(target) {
      if (!(target instanceof Element)) return false;
      const editor = target.closest('[data-lexical-editor="true"]');
      if (editor === null) return false;
      if (editor.closest('[data-composer-seat]') !== null) return true;
      if (editor.closest('[data-conversation-region="composer"]') !== null) return true;
      return false;
    }

    /* A composer popup (@-mention / slash / popupSelect) owns Enter while open. */
    function overlayOpen() {
      const nodes = document.querySelectorAll(
        '[data-trigger-menu],[role="listbox"],[role="menu"]',
      );
      for (const node of nodes) {
        if (node.getClientRects().length > 0) return true;
      }
      return false;
    }

    function onKeyDownCapture(event) {
      if (!settings.enabled) return;
      /* Our own synthetic re-dispatch must never be intercepted again. */
      if (event.isTrusted === false) return;
      if (event.key !== 'Enter' && event.keyCode !== 13) return;
      /* Never swallow IME composition confirmation. */
      if (event.isComposing || event.keyCode === 229) return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (!isComposerEditor(event.target)) return;
      if (overlayOpen()) return;

      /* 只改事件本身，绝不动 DOM。
         dsh 的输入框是 Lexical 富文本：它的换行必须走自己的数据模型。
         直接 execCommand / range.insertNode 会绕过模型，Lexical 下一次
         reconcile 时会把 DOM 重置成模型内容——粘贴进来的文字就是在那一步
         被冲掉的（所以「粘贴后按 Enter，文字消失」）。
         把真实事件的 shiftKey 改成 true 之后：
           · Lexical 判定为 Shift+Enter → 走 INSERT_LINE_BREAK_COMMAND
           · dsh 的提交处理器里有一句 if (event.shiftKey === true) return false
         两条都成立，因此既不发送，编辑器状态也不会被破坏。 */
      try {
        Object.defineProperty(event, 'shiftKey', {
          configurable: true,
          enumerable: true,
          get: () => true,
        });
      } catch (error) {
        /* 改不动就放行，让浏览器走默认行为；绝不再自己动 DOM */
      }
    }

    let started = false;
    function startRuntime() {
      if (started) return;
      started = true;
      document.addEventListener('keydown', onKeyDownCapture, true);
    }

    function Switch({ checked, onChange }) {
      return h('button', {
        type: 'button', role: 'switch', 'aria-checked': checked,
        onClick: () => onChange(!checked),
        style: {
          width: 46, height: 26, borderRadius: 999, border: 0, cursor: 'pointer',
          background: checked ? 'var(--dsw-alias-brand-primary, #4d6bfe)' : 'rgba(128,128,128,.32)',
          position: 'relative', transition: 'background .16s', flex: 'none',
        },
      }, h('span', {
        style: {
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 20, height: 20,
          borderRadius: 999, background: '#fff', transition: 'left .16s',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        },
      }));
    }

    function Row({ title, desc, checked, onChange }) {
      return h('div', {
        style: {
          display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0',
          borderTop: '1px solid ' + LINE,
        },
      },
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { fontSize: 14, fontWeight: 600, marginBottom: 4 } }, title),
          h('div', { style: { fontSize: 12.5, color: MUTED, lineHeight: 1.65 } }, desc),
        ),
        h(Switch, { checked, onChange }),
      );
    }

    function Icon({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        h('polyline', { key: 'a', points: '9 10 4 15 9 20' }),
        h('path', { key: 'b', d: 'M20 4v7a4 4 0 0 1-4 4H4' }),
      );
    }

    function Panel() {
      const [view, setView] = useState(() => Object.assign({}, settings));
      useEffect(() => {
        const fn = (next) => setView(Object.assign({}, next));
        listeners.add(fn);
        return () => { listeners.delete(fn); };
      }, []);
      return h('div', { style: { padding: '20px 22px', maxWidth: 720, margin: '0 auto' } },
        h('div', { style: { marginBottom: 18 } },
          h('div', { style: { fontSize: 17, fontWeight: 600, marginBottom: 4 } }, '换行设置'),
          h('div', { style: { fontSize: 12.5, color: MUTED, lineHeight: 1.6 } },
            '只影响你自己的浏览器。'),
        ),
        h(Row, {
          title: 'Enter 只换行，不发送',
          desc: '开启后按 Enter 插入换行，发送请点发送按钮；Shift+Enter 同样换行。关闭则恢复 dsh 默认（Enter 发送）。',
          checked: view.enabled,
          onChange: (value) => updateSettings({ enabled: value }),
        }),
        h('div', {
          style: {
            marginTop: 16, padding: '12px 14px', borderRadius: 10,
            border: '1px dashed ' + LINE, fontSize: 12.5, lineHeight: 1.7, color: MUTED,
          },
        },
          h('div', { style: { fontWeight: 600, marginBottom: 6 } }, '说明'),
          '设置保存在本机（localStorage: dsh-enter-newline）。',
          '只作用于聊天输入框，不影响会话改名、设置页等其他输入框；',
          '中文输入法组合过程中按 Enter 不会被拦截。',
        ),
      );
    }

    function apply(ctx) {
      startRuntime();
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          { name: 'sidebar.panellist', id: NS, order: 17, locale: NS, label: () => '换行设置' },
          Icon,
        ),
      );
      ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: NS, locale: NS }, Panel),
      );
    }

    return { apply, inject: ['slots'] };
  },
});
