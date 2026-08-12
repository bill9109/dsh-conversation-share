/** Preview modal with a download button for the generated PNG. */
import { chromeFontStack } from "./icons.js";
import { themeColors } from "./theme.js";
import { showToast } from "./toast.js";
function timestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        '-',
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
    ].join('');
}
/** Strip characters illegal in filenames and cap length for a safe download name. */
function sanitizeFilename(title) {
    const cleaned = title
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40);
    return cleaned;
}
export class PreviewModal {
    root = null;
    show(output, title = '') {
        this.hide();
        const vars = themeColors();
        const root = document.createElement('div');
        root.style.cssText = [
            'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;',
            'background:rgb(0 0 0 / 45%);padding:32px;',
        ].join('');
        const panel = document.createElement('div');
        panel.style.cssText = [
            'display:flex;flex-direction:column;gap:14px;max-width:min(860px,100%);max-height:100%;',
            'padding:18px;border-radius:14px;',
            'background:var(--dsw-alias-bg-base, ' + vars.bgBase + ');',
            'border:1px solid var(--dsw-alias-border-l2, ' + vars.borderL2 + ');',
            'box-shadow:0 12px 40px rgb(0 0 0 / 28%);',
        ].join('');
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;flex:none;';
        const titleEl = document.createElement('div');
        titleEl.textContent = `对话分享截图 · ${output.width}×${output.height}px`;
        titleEl.style.cssText = `font:600 14px/20px ${chromeFontStack};color:var(--dsw-alias-label-primary, ${vars.labelPrimary});`;
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = '✕';
        close.setAttribute('aria-label', '关闭预览');
        close.style.cssText = [
            'width:24px;height:24px;border:none;border-radius:6px;background:transparent;',
            'color:var(--dsw-alias-label-secondary, ' + vars.labelSecondary + ');cursor:pointer;',
            'font:500 14px/20px ' + chromeFontStack + ';flex:none;',
        ].join('');
        header.append(titleEl, close);
        const scroll = document.createElement('div');
        // Padding keeps the image's shadow inside the scroll area on every side;
        // long images scroll vertically at their natural size.
        scroll.style.cssText = 'overflow:auto;flex:1 1 auto;min-height:0;padding:16px;background:transparent;';
        const image = document.createElement('img');
        image.src = output.dataUrl;
        image.alt = '对话分享截图';
        // Fit the container width and scroll vertically — never shrink a long
        // image to a sliver to fit the viewport height.
        image.style.cssText = 'max-width:100%;height:auto;display:block;margin:0 auto;border-radius:6px;box-shadow:0 2px 12px rgb(0 0 0 / 16%);';
        scroll.append(image);
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:none;';
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = '复制图片';
        copy.style.cssText = [
            'padding:7px 18px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2, ' + vars.borderL2 + ');',
            'background:transparent;color:var(--dsw-alias-label-secondary, ' + vars.labelSecondary + ');',
            'font:500 13px/20px ' + chromeFontStack + ';cursor:pointer;',
        ].join('');
        copy.addEventListener('click', () => { void this.copy(output.dataUrl); });
        const download = document.createElement('a');
        download.href = output.dataUrl;
        const safeTitle = sanitizeFilename(title);
        download.download = safeTitle === ''
            ? `对话分享-${timestamp()}.png`
            : `对话分享-${safeTitle}-${timestamp()}.png`;
        download.textContent = '下载 PNG';
        download.style.cssText = [
            'padding:7px 18px;border-radius:8px;text-decoration:none;',
            'background:var(--dsw-alias-state-business-primary, ' + vars.businessPrimary + ');color:#fff;',
            'font:500 13px/20px ' + chromeFontStack + ';cursor:pointer;',
        ].join('');
        actions.append(copy, download);
        panel.append(header, scroll, actions);
        root.append(panel);
        document.body.append(root);
        this.root = root;
        const dismiss = () => this.hide();
        close.addEventListener('click', dismiss);
        root.addEventListener('pointerdown', (event) => {
            if (event.target === root)
                dismiss();
        });
        const onKey = (event) => {
            if (event.key === 'Escape')
                dismiss();
        };
        window.addEventListener('keydown', onKey, { once: true });
    }
    /** Copy the PNG to the clipboard via the async Clipboard API. */
    async copy(dataUrl) {
        try {
            const ItemClass = window.ClipboardItem;
            const clipboard = navigator.clipboard;
            if (clipboard === undefined || ItemClass === undefined) {
                throw new Error('当前浏览器不支持剪贴板图片');
            }
            const blob = await (await fetch(dataUrl)).blob();
            await clipboard.write([new ItemClass({ 'image/png': blob })]);
            showToast('已复制到剪贴板');
        }
        catch {
            showToast('复制失败，请使用「下载 PNG」');
        }
    }
    hide() {
        this.root?.remove();
        this.root = null;
    }
}
