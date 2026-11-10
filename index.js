/**
 * host 侧占位。
 * 这个插件的全部逻辑都在浏览器里（见 client.js），这里只是为了让
 * bundle patch 有一个可以 insert 的插件入口。
 */
export const name = 'enter-newline';
export function apply() {}
