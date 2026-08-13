window.__ModuleLoader__.load({
	id: "@bill9109/dsh-conversation-share",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/brand.ts
		/** Clone the DeepSeek Harness brand wordmark for the capture footer. */
		/**
		* The top-left brand is a button whose content is the 182×24 "DeepSeek
		* Harness" inline SVG: the wordmark and the logo mark ride `currentColor`,
		* while the BETA badge text uses
		* `fill="var(--dsw-alias-label-primary-inverted)"` clipped by
		* `url(#dsh-wordmark-badge-clip)`.
		*
		* The button's CSS-module class is hashed per web-UI build (observed values:
		* `EGiMFG_brand EGiMFG_wide`, `DEy3Aq_brand DEy3Aq_wide`, …). Matching a
		* specific hash silently drops the footer the moment the web UI is rebuilt,
		* so the lookup instead matches the stable `_brand` class token, with the
		* wordmark's `viewBox` as a fallback for future renames.
		*
		* Two SVG-image-isolation problems are handled here:
		*  1. `var()` fills must be baked to their computed colors — and that can
		*     only be read from the LIVE (in-document) elements, since the detached
		*     clone cannot resolve CSS variables.
		*  2. `url(#...)` clip-path references do not resolve when the SVG is
		*     re-rendered inside an isolated SVG image, which blanks clipped content
		*     (exactly what made the badge text disappear). The clip regions only
		*     trim overflow already inside the artwork bounds, so dropping the
		*     clip-path attributes is safe and restores the text.
		*/
		/** viewBox of the DeepSeek Harness wordmark SVG (stable across builds). */
		const BRAND_VIEWBOX = "0 0 182 24";
		function findBrandSvg() {
			const svg = findBrandSvgElement();
			if (svg === null) return null;
			const host = svg.parentElement ?? svg;
			const clone = svg.cloneNode(true);
			clone.style.color = getComputedStyle(host).color;
			resolvePresentationColors(svg, clone);
			neutralizeClipPaths(clone);
			return clone;
		}
		function findBrandSvgElement() {
			const buttons = Array.from(document.querySelectorAll("button[class*=\"_brand\"]"));
			for (const button of buttons) {
				const svg = button.querySelector("svg");
				if (svg !== null && svg.getAttribute("viewBox") === BRAND_VIEWBOX) return svg;
			}
			for (const button of buttons) {
				const svg = button.querySelector("svg");
				if (svg !== null) return svg;
			}
			return document.querySelector(`svg[viewBox="${BRAND_VIEWBOX}"]`);
		}
		/** Copy resolved fill/stroke colors from the live SVG onto the clone. */
		function resolvePresentationColors(source, clone) {
			const sources = [source, ...Array.from(source.querySelectorAll("*"))];
			const targets = [clone, ...Array.from(clone.querySelectorAll("*"))];
			for (let i = 0; i < sources.length && i < targets.length; i++) {
				const original = sources[i];
				const target = targets[i];
				for (const attribute of ["fill", "stroke"]) {
					const value = original.getAttribute(attribute);
					if (value !== null && value.startsWith("var(")) {
						const resolved = getComputedStyle(original)[attribute];
						if (resolved !== "" && resolved !== "none" && !resolved.startsWith("var(")) target.setAttribute(attribute, resolved);
					}
				}
			}
		}
		/** Drop `url(#...)` clip-path references (broken in isolated SVG images). */
		function neutralizeClipPaths(clone) {
			for (const el of [clone, ...Array.from(clone.querySelectorAll("*"))]) if (el.getAttribute("clip-path") !== null) el.removeAttribute("clip-path");
		}
		//#endregion
		//#region src/vendor/html-to-image/util.ts
		function resolveUrl(url, baseUrl) {
			if (url.match(/^[a-z]+:\/\//i)) return url;
			if (url.match(/^\/\//)) return window.location.protocol + url;
			if (url.match(/^[a-z]+:/i)) return url;
			const doc = document.implementation.createHTMLDocument();
			const base = doc.createElement("base");
			const a = doc.createElement("a");
			doc.head.appendChild(base);
			doc.body.appendChild(a);
			if (baseUrl) base.href = baseUrl;
			a.href = url;
			return a.href;
		}
		const uuid = (() => {
			let counter = 0;
			const random = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
			return () => {
				counter += 1;
				return `u${random()}${counter}`;
			};
		})();
		function toArray(arrayLike) {
			const arr = [];
			for (let i = 0, l = arrayLike.length; i < l; i++) arr.push(arrayLike[i]);
			return arr;
		}
		let styleProps = null;
		function getStyleProperties(options = {}) {
			if (styleProps) return styleProps;
			if (options.includeStyleProperties) {
				styleProps = options.includeStyleProperties;
				return styleProps;
			}
			styleProps = toArray(window.getComputedStyle(document.documentElement));
			return styleProps;
		}
		function px(node, styleProperty) {
			const val = (node.ownerDocument.defaultView || window).getComputedStyle(node).getPropertyValue(styleProperty);
			return val ? parseFloat(val.replace("px", "")) : 0;
		}
		function getNodeWidth(node) {
			const leftBorder = px(node, "border-left-width");
			const rightBorder = px(node, "border-right-width");
			return node.clientWidth + leftBorder + rightBorder;
		}
		function getNodeHeight(node) {
			const topBorder = px(node, "border-top-width");
			const bottomBorder = px(node, "border-bottom-width");
			return node.clientHeight + topBorder + bottomBorder;
		}
		function getImageSize(targetNode, options = {}) {
			return {
				width: options.width || getNodeWidth(targetNode),
				height: options.height || getNodeHeight(targetNode)
			};
		}
		function getPixelRatio() {
			let ratio;
			let FINAL_PROCESS;
			try {
				FINAL_PROCESS = process;
			} catch (e) {}
			const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
			if (val) {
				ratio = parseInt(val, 10);
				if (Number.isNaN(ratio)) ratio = 1;
			}
			return ratio || window.devicePixelRatio || 1;
		}
		const canvasDimensionLimit = 16384;
		function checkCanvasDimensions(canvas) {
			if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) if (canvas.width > canvas.height) {
				canvas.height *= canvasDimensionLimit / canvas.width;
				canvas.width = canvasDimensionLimit;
			} else {
				canvas.width *= canvasDimensionLimit / canvas.height;
				canvas.height = canvasDimensionLimit;
			}
			else if (canvas.width > canvasDimensionLimit) {
				canvas.height *= canvasDimensionLimit / canvas.width;
				canvas.width = canvasDimensionLimit;
			} else {
				canvas.width *= canvasDimensionLimit / canvas.height;
				canvas.height = canvasDimensionLimit;
			}
		}
		function createImage(url) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => {
					img.decode().then(() => {
						requestAnimationFrame(() => resolve(img));
					});
				};
				img.onerror = reject;
				img.crossOrigin = "anonymous";
				img.decoding = "async";
				img.src = url;
			});
		}
		async function svgToDataURL(svg) {
			return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
		}
		async function nodeToDataURL(node, width, height) {
			const xmlns = "http://www.w3.org/2000/svg";
			const svg = document.createElementNS(xmlns, "svg");
			const foreignObject = document.createElementNS(xmlns, "foreignObject");
			svg.setAttribute("width", `${width}`);
			svg.setAttribute("height", `${height}`);
			svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
			foreignObject.setAttribute("width", "100%");
			foreignObject.setAttribute("height", "100%");
			foreignObject.setAttribute("x", "0");
			foreignObject.setAttribute("y", "0");
			foreignObject.setAttribute("externalResourcesRequired", "true");
			svg.appendChild(foreignObject);
			foreignObject.appendChild(node);
			return svgToDataURL(svg);
		}
		const isInstanceOfElement = (node, instance) => {
			if (node instanceof instance) return true;
			const nodePrototype = Object.getPrototypeOf(node);
			if (nodePrototype === null) return false;
			return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
		};
		//#endregion
		//#region src/vendor/html-to-image/clone-pseudos.ts
		function formatCSSText(style) {
			const content = style.getPropertyValue("content");
			return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
		}
		function formatCSSProperties(style, options) {
			return getStyleProperties(options).map((name) => {
				return `${name}: ${style.getPropertyValue(name)}${style.getPropertyPriority(name) ? " !important" : ""};`;
			}).join(" ");
		}
		function getPseudoElementStyle(className, pseudo, style, options) {
			const selector = `.${className}:${pseudo}`;
			const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
			return document.createTextNode(`${selector}{${cssText}}`);
		}
		function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
			const style = window.getComputedStyle(nativeNode, pseudo);
			const content = style.getPropertyValue("content");
			if (content === "" || content === "none") return;
			const className = uuid();
			try {
				clonedNode.className = `${clonedNode.className} ${className}`;
			} catch (err) {
				return;
			}
			const styleElement = document.createElement("style");
			styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
			clonedNode.appendChild(styleElement);
		}
		function clonePseudoElements(nativeNode, clonedNode, options) {
			clonePseudoElement(nativeNode, clonedNode, ":before", options);
			clonePseudoElement(nativeNode, clonedNode, ":after", options);
		}
		//#endregion
		//#region src/vendor/html-to-image/mimes.ts
		const WOFF = "application/font-woff";
		const JPEG = "image/jpeg";
		const mimes = {
			woff: WOFF,
			woff2: WOFF,
			ttf: "application/font-truetype",
			eot: "application/vnd.ms-fontobject",
			png: "image/png",
			jpg: JPEG,
			jpeg: JPEG,
			gif: "image/gif",
			tiff: "image/tiff",
			svg: "image/svg+xml",
			webp: "image/webp"
		};
		function getExtension(url) {
			const match = /\.([^./]*?)$/g.exec(url);
			return match ? match[1] : "";
		}
		function getMimeType(url) {
			return mimes[getExtension(url).toLowerCase()] || "";
		}
		//#endregion
		//#region src/vendor/html-to-image/dataurl.ts
		function getContentFromDataUrl(dataURL) {
			return dataURL.split(/,/)[1];
		}
		function isDataUrl(url) {
			return url.search(/^(data:)/) !== -1;
		}
		function makeDataUrl(content, mimeType) {
			return `data:${mimeType};base64,${content}`;
		}
		async function fetchAsDataURL(url, init, process) {
			const res = await fetch(url, init);
			if (res.status === 404) throw new Error(`Resource "${res.url}" not found`);
			const blob = await res.blob();
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = reject;
				reader.onloadend = () => {
					try {
						resolve(process({
							res,
							result: reader.result
						}));
					} catch (error) {
						reject(error);
					}
				};
				reader.readAsDataURL(blob);
			});
		}
		const cache = {};
		function getCacheKey(url, contentType, includeQueryParams) {
			let key = url.replace(/\?.*/, "");
			if (includeQueryParams) key = url;
			if (/ttf|otf|eot|woff2?/i.test(key)) key = key.replace(/.*\//, "");
			return contentType ? `[${contentType}]${key}` : key;
		}
		async function resourceToDataURL(resourceUrl, contentType, options) {
			const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
			if (cache[cacheKey] != null) return cache[cacheKey];
			if (options.cacheBust) resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
			let dataURL;
			try {
				dataURL = makeDataUrl(await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
					if (!contentType) contentType = res.headers.get("Content-Type") || "";
					return getContentFromDataUrl(result);
				}), contentType);
			} catch (error) {
				dataURL = options.imagePlaceholder || "";
				let msg = `Failed to fetch resource: ${resourceUrl}`;
				if (error) msg = typeof error === "string" ? error : error.message;
				if (msg) console.warn(msg);
			}
			cache[cacheKey] = dataURL;
			return dataURL;
		}
		//#endregion
		//#region src/vendor/html-to-image/clone-node.ts
		async function cloneCanvasElement(canvas) {
			const dataURL = canvas.toDataURL();
			if (dataURL === "data:,") return canvas.cloneNode(false);
			return createImage(dataURL);
		}
		async function cloneVideoElement(video, options) {
			if (video.currentSrc) {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				canvas.width = video.clientWidth;
				canvas.height = video.clientHeight;
				ctx === null || ctx === void 0 || ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				return createImage(canvas.toDataURL());
			}
			const poster = video.poster;
			return createImage(await resourceToDataURL(poster, getMimeType(poster), options));
		}
		async function cloneIFrameElement(iframe, options) {
			var _a;
			try {
				if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) return await cloneNode(iframe.contentDocument.body, options, true);
			} catch (_b) {}
			return iframe.cloneNode(false);
		}
		async function cloneSingleNode(node, options) {
			if (isInstanceOfElement(node, HTMLCanvasElement)) return cloneCanvasElement(node);
			if (isInstanceOfElement(node, HTMLVideoElement)) return cloneVideoElement(node, options);
			if (isInstanceOfElement(node, HTMLIFrameElement)) return cloneIFrameElement(node, options);
			return node.cloneNode(isSVGElement(node));
		}
		const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
		const isSVGElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SVG";
		async function cloneChildren(nativeNode, clonedNode, options) {
			var _a, _b;
			if (isSVGElement(clonedNode)) return clonedNode;
			let children = [];
			if (isSlotElement(nativeNode) && nativeNode.assignedNodes) children = toArray(nativeNode.assignedNodes());
			else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) children = toArray(nativeNode.contentDocument.body.childNodes);
			else children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
			if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) return clonedNode;
			await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
				if (clonedChild) clonedNode.appendChild(clonedChild);
			}), Promise.resolve());
			return clonedNode;
		}
		function cloneCSSStyle(nativeNode, clonedNode, options) {
			const targetStyle = clonedNode.style;
			if (!targetStyle) return;
			const sourceStyle = window.getComputedStyle(nativeNode);
			if (sourceStyle.cssText) {
				targetStyle.cssText = sourceStyle.cssText;
				targetStyle.transformOrigin = sourceStyle.transformOrigin;
			} else getStyleProperties(options).forEach((name) => {
				let value = sourceStyle.getPropertyValue(name);
				if (name === "font-size" && value.endsWith("px")) value = `${Math.floor(parseFloat(value.substring(0, value.length - 2))) - .1}px`;
				if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") value = "block";
				if (name === "d" && clonedNode.getAttribute("d")) value = `path(${clonedNode.getAttribute("d")})`;
				targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
			});
		}
		function cloneInputValue(nativeNode, clonedNode) {
			if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) clonedNode.innerHTML = nativeNode.value;
			if (isInstanceOfElement(nativeNode, HTMLInputElement)) clonedNode.setAttribute("value", nativeNode.value);
		}
		function cloneSelectValue(nativeNode, clonedNode) {
			if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
				const clonedSelect = clonedNode;
				const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
				if (selectedOption) selectedOption.setAttribute("selected", "");
			}
		}
		function decorate(nativeNode, clonedNode, options) {
			if (isInstanceOfElement(clonedNode, Element)) {
				cloneCSSStyle(nativeNode, clonedNode, options);
				clonePseudoElements(nativeNode, clonedNode, options);
				cloneInputValue(nativeNode, clonedNode);
				cloneSelectValue(nativeNode, clonedNode);
			}
			return clonedNode;
		}
		async function ensureSVGSymbols(clone, options) {
			const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
			if (uses.length === 0) return clone;
			const processedDefs = {};
			for (let i = 0; i < uses.length; i++) {
				const id = uses[i].getAttribute("xlink:href");
				if (id) {
					const exist = clone.querySelector(id);
					const definition = document.querySelector(id);
					if (!exist && definition && !processedDefs[id]) processedDefs[id] = await cloneNode(definition, options, true);
				}
			}
			const nodes = Object.values(processedDefs);
			if (nodes.length) {
				const ns = "http://www.w3.org/1999/xhtml";
				const svg = document.createElementNS(ns, "svg");
				svg.setAttribute("xmlns", ns);
				svg.style.position = "absolute";
				svg.style.width = "0";
				svg.style.height = "0";
				svg.style.overflow = "hidden";
				svg.style.display = "none";
				const defs = document.createElementNS(ns, "defs");
				svg.appendChild(defs);
				for (let i = 0; i < nodes.length; i++) defs.appendChild(nodes[i]);
				clone.appendChild(svg);
			}
			return clone;
		}
		async function cloneNode(node, options, isRoot) {
			if (!isRoot && options.filter && !options.filter(node)) return null;
			return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode, options)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
		}
		//#endregion
		//#region src/vendor/html-to-image/embed-resources.ts
		const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
		const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
		const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
		function toRegex(url) {
			const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
			return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
		}
		function parseURLs(cssText) {
			const urls = [];
			cssText.replace(URL_REGEX, (raw, quotation, url) => {
				urls.push(url);
				return raw;
			});
			return urls.filter((url) => !isDataUrl(url));
		}
		async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
			try {
				const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
				const contentType = getMimeType(resourceURL);
				let dataURL;
				if (getContentFromUrl) dataURL = makeDataUrl(await getContentFromUrl(resolvedURL), contentType);
				else dataURL = await resourceToDataURL(resolvedURL, contentType, options);
				return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
			} catch (error) {}
			return cssText;
		}
		function filterPreferredFontFormat(str, { preferredFontFormat }) {
			return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
				while (true) {
					const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
					if (!format) return "";
					if (format === preferredFontFormat) return `src: ${src};`;
				}
			});
		}
		function shouldEmbed(url) {
			return url.search(URL_REGEX) !== -1;
		}
		async function embedResources(cssText, baseUrl, options) {
			if (!shouldEmbed(cssText)) return cssText;
			const filteredCSSText = filterPreferredFontFormat(cssText, options);
			return parseURLs(filteredCSSText).reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
		}
		//#endregion
		//#region src/vendor/html-to-image/embed-images.ts
		async function embedProp(propName, node, options) {
			var _a;
			const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
			if (propValue) {
				const cssString = await embedResources(propValue, null, options);
				node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
				return true;
			}
			return false;
		}
		async function embedBackground(clonedNode, options) {
			await embedProp("background", clonedNode, options) || await embedProp("background-image", clonedNode, options);
			await embedProp("mask", clonedNode, options) || await embedProp("-webkit-mask", clonedNode, options) || await embedProp("mask-image", clonedNode, options) || await embedProp("-webkit-mask-image", clonedNode, options);
		}
		async function embedImageNode(clonedNode, options) {
			const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
			if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) return;
			const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
			const dataURL = await resourceToDataURL(url, getMimeType(url), options);
			await new Promise((resolve, reject) => {
				clonedNode.onload = resolve;
				clonedNode.onerror = options.onImageErrorHandler ? (...attributes) => {
					try {
						resolve(options.onImageErrorHandler(...attributes));
					} catch (error) {
						reject(error);
					}
				} : reject;
				const image = clonedNode;
				if (image.decode) image.decode = resolve;
				if (image.loading === "lazy") image.loading = "eager";
				if (isImageElement) {
					clonedNode.srcset = "";
					clonedNode.src = dataURL;
				} else clonedNode.href.baseVal = dataURL;
			});
		}
		async function embedChildren(clonedNode, options) {
			const deferreds = toArray(clonedNode.childNodes).map((child) => embedImages(child, options));
			await Promise.all(deferreds).then(() => clonedNode);
		}
		async function embedImages(clonedNode, options) {
			if (isInstanceOfElement(clonedNode, Element)) {
				await embedBackground(clonedNode, options);
				await embedImageNode(clonedNode, options);
				await embedChildren(clonedNode, options);
			}
		}
		//#endregion
		//#region src/vendor/html-to-image/apply-style.ts
		function applyStyle(node, options) {
			const { style } = node;
			if (options.backgroundColor) style.backgroundColor = options.backgroundColor;
			if (options.width) style.width = `${options.width}px`;
			if (options.height) style.height = `${options.height}px`;
			const manual = options.style;
			if (manual != null) Object.keys(manual).forEach((key) => {
				style[key] = manual[key];
			});
			return node;
		}
		//#endregion
		//#region src/vendor/html-to-image/embed-webfonts.ts
		const cssFetchCache = {};
		async function fetchCSS(url) {
			let cache = cssFetchCache[url];
			if (cache != null) return cache;
			cache = {
				url,
				cssText: await (await fetch(url)).text()
			};
			cssFetchCache[url] = cache;
			return cache;
		}
		async function embedFonts(data, options) {
			let cssText = data.cssText;
			const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
			const loadFonts = (cssText.match(/url\([^)]+\)/g) || []).map(async (loc) => {
				let url = loc.replace(regexUrl, "$1");
				if (!url.startsWith("https://")) url = new URL(url, data.url).href;
				return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
					cssText = cssText.replace(loc, `url(${result})`);
					return [loc, result];
				});
			});
			return Promise.all(loadFonts).then(() => cssText);
		}
		function parseCSS(source) {
			if (source == null) return [];
			const result = [];
			let cssText = source.replace(/(\/\*[\s\S]*?\*\/)/gi, "");
			const keyframesRegex = /* @__PURE__ */ new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
			while (true) {
				const matches = keyframesRegex.exec(cssText);
				if (matches === null) break;
				result.push(matches[0]);
			}
			cssText = cssText.replace(keyframesRegex, "");
			const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
			const unifiedRegex = /* @__PURE__ */ new RegExp("((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", "gi");
			while (true) {
				let matches = importRegex.exec(cssText);
				if (matches === null) {
					matches = unifiedRegex.exec(cssText);
					if (matches === null) break;
					else importRegex.lastIndex = unifiedRegex.lastIndex;
				} else unifiedRegex.lastIndex = importRegex.lastIndex;
				result.push(matches[0]);
			}
			return result;
		}
		async function getCSSRules(styleSheets, options) {
			const ret = [];
			const deferreds = [];
			styleSheets.forEach((sheet) => {
				if ("cssRules" in sheet) try {
					toArray(sheet.cssRules || []).forEach((item, index) => {
						if (item.type === CSSRule.IMPORT_RULE) {
							let importIndex = index + 1;
							const url = item.href;
							const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
								try {
									sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
								} catch (error) {
									console.error("Error inserting rule from remote css", {
										rule,
										error
									});
								}
							})).catch((e) => {
								console.error("Error loading remote css", e.toString());
							});
							deferreds.push(deferred);
						}
					});
				} catch (e) {
					const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
					if (sheet.href != null) deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
						inline.insertRule(rule, inline.cssRules.length);
					})).catch((err) => {
						console.error("Error loading remote stylesheet", err);
					}));
					console.error("Error inlining remote css file", e);
				}
			});
			return Promise.all(deferreds).then(() => {
				styleSheets.forEach((sheet) => {
					if ("cssRules" in sheet) try {
						toArray(sheet.cssRules || []).forEach((item) => {
							ret.push(item);
						});
					} catch (e) {
						console.error(`Error while reading CSS rules from ${sheet.href}`, e);
					}
				});
				return ret;
			});
		}
		function getWebFontRules(cssRules) {
			return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
		}
		async function parseWebFontRules(node, options) {
			if (node.ownerDocument == null) throw new Error("Provided element is not within a Document");
			return getWebFontRules(await getCSSRules(toArray(node.ownerDocument.styleSheets), options));
		}
		function normalizeFontFamily(font) {
			return font.trim().replace(/["']/g, "");
		}
		function getUsedFonts(node) {
			const fonts = /* @__PURE__ */ new Set();
			function traverse(node) {
				(node.style.fontFamily || getComputedStyle(node).fontFamily).split(",").forEach((font) => {
					fonts.add(normalizeFontFamily(font));
				});
				Array.from(node.children).forEach((child) => {
					if (child instanceof HTMLElement) traverse(child);
				});
			}
			traverse(node);
			return fonts;
		}
		async function getWebFontCSS(node, options) {
			const rules = await parseWebFontRules(node, options);
			const usedFonts = getUsedFonts(node);
			return (await Promise.all(rules.filter((rule) => usedFonts.has(normalizeFontFamily(rule.style.fontFamily))).map((rule) => {
				const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
				return embedResources(rule.cssText, baseUrl, options);
			}))).join("\n");
		}
		async function embedWebFonts(clonedNode, options) {
			const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
			if (cssText) {
				const styleNode = document.createElement("style");
				const sytleContent = document.createTextNode(cssText);
				styleNode.appendChild(sytleContent);
				if (clonedNode.firstChild) clonedNode.insertBefore(styleNode, clonedNode.firstChild);
				else clonedNode.appendChild(styleNode);
			}
		}
		//#endregion
		//#region src/vendor/html-to-image/index-impl.ts
		async function toSvg(node, options = {}) {
			const { width, height } = getImageSize(node, options);
			const clonedNode = await cloneNode(node, options, true);
			await embedWebFonts(clonedNode, options);
			await embedImages(clonedNode, options);
			applyStyle(clonedNode, options);
			return await nodeToDataURL(clonedNode, width, height);
		}
		async function toCanvas(node, options = {}) {
			const { width, height } = getImageSize(node, options);
			const img = await createImage(await toSvg(node, options));
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			const ratio = options.pixelRatio || getPixelRatio();
			const canvasWidth = options.canvasWidth || width;
			const canvasHeight = options.canvasHeight || height;
			canvas.width = canvasWidth * ratio;
			canvas.height = canvasHeight * ratio;
			if (!options.skipAutoScale) checkCanvasDimensions(canvas);
			canvas.style.width = `${canvasWidth}`;
			canvas.style.height = `${canvasHeight}`;
			if (options.backgroundColor) {
				context.fillStyle = options.backgroundColor;
				context.fillRect(0, 0, canvas.width, canvas.height);
			}
			context.drawImage(img, 0, 0, canvas.width, canvas.height);
			return canvas;
		}
		//#endregion
		//#region src/vendor/html-to-image/index.ts
		/**
		* Typed re-export of the vendored html-to-image implementation.
		*
		* The vendored sources (this directory) are html-to-image 1.11.13 (MIT);
		* see LICENSE in this directory. Only the entry surface needed by the
		* capture pipeline is re-exported here with a local Options type (the
		* upstream es build ships its types separately, so we restate the option
		* shape we consume).
		*/
		//#endregion
		//#region src/client/capture.ts
		/**
		* PNG long-image capture of the conversation range between two snap targets.
		*
		* Strategy: clone the chat rows between the range boundaries, render them in
		* height-bounded chunks with the vendored html-to-image engine, crop each
		* boundary chunk to the exact snapped element edges, stitch the chunks into
		* one canvas and append the brand footer. Chunking keeps every intermediate
		* canvas far below the browser's ~32767px canvas limit, so arbitrarily long
		* conversations export as a single image.
		*/
		/** Side padding per side, in points (doubled per user feedback: 40pt). */
		const SIDE_PADDING_PT = 40;
		/** Points per inch constant (CSS: 1pt = 1/72in; at 96dpi that is 4/3px). */
		const PT_TO_PX = 96 / 72;
		/** Target chunk height in css px. */
		const CHUNK_TARGET_PX = 3e3;
		/** Brand footer vertical rhythm. */
		const FOOTER_PAD_PX = 28;
		/** Hard ceiling for the output canvas height in device px (browser canvas limit). */
		const MAX_DEVICE_HEIGHT = 3e4;
		/**
		* Ceiling for a single html-to-image render. The vendored engine resolves its
		* image load through `requestAnimationFrame`, which browsers pause in hidden
		* tabs — without this bound the confirm flow would hang forever.
		*/
		const RENDER_TIMEOUT_MS = 3e4;
		var CaptureError = class extends Error {};
		/** The chat row (direct flowList child) containing an element. */
		function rowOf(el, flowList) {
			let current = el;
			while (current !== null && current.parentElement !== flowList) current = current.parentElement;
			if (current === null) throw new CaptureError("范围标记不在对话流中");
			return current;
		}
		function clamp$1(value, min, max) {
			return Math.min(Math.max(value, min), max);
		}
		/** Reject a promise after `ms`, leaving the underlying work to settle on its own. */
		function withTimeout(promise, ms, message) {
			return new Promise((resolve, reject) => {
				const timer = window.setTimeout(() => reject(new CaptureError(message)), ms);
				promise.then((value) => {
					window.clearTimeout(timer);
					resolve(value);
				}, (error) => {
					window.clearTimeout(timer);
					reject(error);
				});
			});
		}
		const RENDER_TIMEOUT_MESSAGE = "截图渲染超时（标签页可能被切到后台），请切回本页后重试";
		function buildChunkWrapper(rows, contentWidth, sidePadPx, outerWidth, themeBg, flowList) {
			const wrapper = document.createElement("div");
			const flowPosition = getComputedStyle(flowList).position;
			wrapper.style.cssText = [
				`position:fixed;left:-100000px;top:0;pointer-events:none;`,
				`width:${outerWidth}px;background:${themeBg};`,
				`padding:0 ${sidePadPx}px;box-sizing:border-box;`
			].join("");
			const inner = document.createElement("div");
			const flowStyle = getComputedStyle(flowList);
			inner.style.cssText = [
				`width:${contentWidth}px;box-sizing:border-box;`,
				`display:${flowStyle.display};`,
				flowStyle.flexDirection ? `flex-direction:${flowStyle.flexDirection};` : "",
				flowStyle.gap ? `gap:${flowStyle.gap};` : "",
				flowStyle.alignItems ? `align-items:${flowStyle.alignItems};` : "",
				flowPosition === "static" ? "" : `position:${flowPosition};`
			].join("");
			for (const row of rows) inner.append(row.cloneNode(true));
			wrapper.append(inner);
			return wrapper;
		}
		function buildFooterWrapper(outerWidth, footerHeight, themeBg, brandSvg) {
			const wrapper = document.createElement("div");
			wrapper.style.cssText = [
				`position:fixed;left:-100000px;top:0;pointer-events:none;`,
				`width:${outerWidth}px;height:${footerHeight}px;background:${themeBg};`,
				`display:flex;flex-direction:column;align-items:center;justify-content:flex-end;`,
				`padding-bottom:${FOOTER_PAD_PX}px;box-sizing:border-box;`
			].join("");
			if (brandSvg !== null) {
				const brand = brandSvg.cloneNode(true);
				brand.style.display = "block";
				wrapper.append(brand);
			}
			return wrapper;
		}
		async function captureRange(params) {
			const { scrollport, flowList, startEl, endEl, brandSvg, themeBg } = params;
			const rows = Array.from(flowList.children).filter((child) => child instanceof HTMLElement);
			const startRow = rowOf(startEl, flowList);
			const endRow = rowOf(endEl, flowList);
			const startIndex = rows.indexOf(startRow);
			const endIndex = rows.indexOf(endRow);
			if (startIndex === -1 || endIndex === -1) throw new CaptureError("无法定位对话范围");
			const slice = rows.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
			const firstRow = slice[0];
			const lastRow = slice[slice.length - 1];
			const firstRect = firstRow.getBoundingClientRect();
			const lastRect = lastRow.getBoundingClientRect();
			const scrollTop = scrollport.scrollTop;
			const startView = params.startEdge !== void 0 ? params.startEdge - scrollTop : startEl.getBoundingClientRect().top;
			const endView = params.endEdge !== void 0 ? params.endEdge - scrollTop : endEl.getBoundingClientRect().bottom;
			const topCrop = clamp$1(startView - firstRect.top, 0, Math.max(0, firstRect.height - 1));
			const bottomCrop = clamp$1(lastRect.bottom - endView, 0, Math.max(0, lastRect.height - 1));
			const flowStyle = getComputedStyle(flowList);
			const padLeft = parseFloat(flowStyle.paddingLeft) || 0;
			const padRight = parseFloat(flowStyle.paddingRight) || 0;
			const contentWidth = Math.max(120, flowList.clientWidth - padLeft - padRight);
			const sidePadPx = SIDE_PADDING_PT * PT_TO_PX;
			const outerWidth = contentWidth + sidePadPx * 2;
			const heights = slice.map((row) => row.getBoundingClientRect().height);
			const chunks = [];
			let current = [];
			let currentHeight = 0;
			for (let i = 0; i < slice.length; i++) {
				current.push(i);
				currentHeight += heights[i];
				if (currentHeight >= CHUNK_TARGET_PX || i === slice.length - 1) {
					chunks.push(current);
					current = [];
					currentHeight = 0;
				}
			}
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const footerHeight = sidePadPx + (brandSvg !== null ? Number(brandSvg.getAttribute("height")) || 24 : 0) + FOOTER_PAD_PX;
			const topPadPx = sidePadPx;
			const estimatedHeight = topPadPx + heights.reduce((sum, h) => sum + h, 0) + footerHeight;
			if (Math.round(estimatedHeight * dpr) > MAX_DEVICE_HEIGHT) throw new CaptureError("选择范围过长，请缩短范围后重试");
			const chunkCanvases = [];
			const chunkHeights = [];
			for (let c = 0; c < chunks.length; c++) {
				const wrapper = buildChunkWrapper(chunks[c].map((index) => slice[index]), contentWidth, sidePadPx, outerWidth, themeBg, flowList);
				document.body.append(wrapper);
				try {
					const measuredHeight = wrapper.offsetHeight;
					const canvas = await withTimeout(toCanvas(wrapper, {
						width: outerWidth,
						height: measuredHeight,
						pixelRatio: dpr,
						skipFonts: true,
						backgroundColor: themeBg,
						style: {
							position: "static",
							left: "0px",
							top: "0px"
						}
					}), RENDER_TIMEOUT_MS, RENDER_TIMEOUT_MESSAGE);
					let srcTop = 0;
					let srcHeight = canvas.height;
					if (c === 0) {
						srcTop = Math.round(topCrop * dpr);
						srcHeight -= srcTop;
					}
					if (c === chunks.length - 1) srcHeight -= Math.round(bottomCrop * dpr);
					if (srcHeight <= 0) throw new CaptureError("选择范围为空");
					const cropped = document.createElement("canvas");
					cropped.width = canvas.width;
					cropped.height = srcHeight;
					const context = cropped.getContext("2d");
					if (context === null) throw new CaptureError("无法初始化画布");
					context.drawImage(canvas, 0, srcTop, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
					chunkCanvases.push(cropped);
					chunkHeights.push(srcHeight / dpr);
				} finally {
					wrapper.remove();
				}
			}
			const footerWrapper = buildFooterWrapper(outerWidth, footerHeight, themeBg, brandSvg);
			document.body.append(footerWrapper);
			let footerCanvas = null;
			try {
				footerCanvas = brandSvg === null ? null : await withTimeout(toCanvas(footerWrapper, {
					width: outerWidth,
					height: footerHeight,
					pixelRatio: dpr,
					skipFonts: true,
					backgroundColor: themeBg,
					style: {
						position: "static",
						left: "0px",
						top: "0px"
					}
				}), RENDER_TIMEOUT_MS, RENDER_TIMEOUT_MESSAGE);
			} finally {
				footerWrapper.remove();
			}
			const totalHeight = topPadPx + chunkHeights.reduce((sum, h) => sum + h, 0) + (footerCanvas !== null ? footerHeight : 0);
			const deviceWidth = Math.round(outerWidth * dpr);
			const deviceHeight = Math.round(totalHeight * dpr);
			if (deviceHeight > MAX_DEVICE_HEIGHT) throw new CaptureError("选择范围过长，请缩短范围后重试");
			const output = document.createElement("canvas");
			output.width = deviceWidth;
			output.height = deviceHeight;
			const context = output.getContext("2d");
			if (context === null) throw new CaptureError("无法初始化画布");
			context.fillStyle = themeBg;
			context.fillRect(0, 0, deviceWidth, deviceHeight);
			let y = topPadPx;
			for (let c = 0; c < chunkCanvases.length; c++) {
				const canvas = chunkCanvases[c];
				context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, Math.round(y * dpr), deviceWidth, canvas.height);
				y += chunkHeights[c];
			}
			if (footerCanvas !== null) context.drawImage(footerCanvas, 0, Math.round(y * dpr), deviceWidth, footerCanvas.height);
			return {
				dataUrl: output.toDataURL("image/png"),
				width: deviceWidth,
				height: deviceHeight
			};
		}
		//#endregion
		//#region src/client/dom.ts
		/** Locate the conversation chrome the share feature rides on. */
		/** The 对话/轨迹 tab row (only present for a real session header). */
		function findTablist() {
			return document.querySelector("[data-phase] [role=\"tablist\"]");
		}
		/** The conversation column's scrollport (host of the chat flow). */
		function findScrollport() {
			return document.querySelector("[data-conversation-scroll]");
		}
		/** The chat flow list (children are the semantic chat rows). */
		function findFlowList() {
			return document.querySelector("[data-chat-flow]");
		}
		/** The sticky composer seat inside the scrollport, when present. */
		function findComposerSeat(scrollport) {
			return scrollport.querySelector("[data-composer-seat]");
		}
		/** The header's right-end utilities strip (home of the Session log button). */
		function findHeaderUtilities() {
			return Array.from(document.querySelectorAll("header button")).find((b) => /session\s*log/i.test((b.textContent ?? "").trim()) && (b.textContent ?? "").trim().length < 30)?.parentElement ?? null;
		}
		/** Ensure the 对话 tab is active (the share flow operates on the chat view). */
		function switchToChatTab() {
			const tablist = findTablist();
			if (tablist === null) return;
			const tabs = Array.from(tablist.querySelectorAll("[role=\"tab\"]"));
			if (tabs.length < 2) return;
			const active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
			if (active === void 0 || active === tabs[0]) return;
			tabs[0].click();
		}
		//#endregion
		//#region src/client/theme.ts
		/** Resolve live theme colors from the document (tokens resolve per build). */
		function readVar(name, fallback) {
			const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
			return value === "" ? fallback : value;
		}
		/** Snapshot of the design-token colors used by the share chrome. */
		function themeColors() {
			return {
				businessPrimary: readVar("--dsw-alias-state-business-primary", "#3964fe"),
				labelPrimary: readVar("--dsw-alias-label-primary", "#1a1a1a"),
				labelSecondary: readVar("--dsw-alias-label-secondary", "#525252"),
				labelTertiary: readVar("--dsw-alias-label-tertiary", "#8a8a8a"),
				bgBase: readVar("--dsw-alias-bg-base", "#ffffff"),
				bgRaise: readVar("--dsw-alias-bg-layer-2", "#ffffff"),
				borderL2: readVar("--dsw-alias-border-l2", "#e5e5e5")
			};
		}
		/**
		* Resolve the effective page background behind the conversation column, so
		* the capture's side padding matches the surrounding page color exactly.
		*/
		function resolveThemeBackground() {
			const scoped = document.querySelector("[data-conversation-scroll]");
			const probe = (el) => {
				while (el !== null) {
					const bg = getComputedStyle(el).backgroundColor;
					if (bg !== "" && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return bg;
					el = el.parentElement;
				}
				return null;
			};
			const found = probe(scoped ?? document.body);
			if (found !== null) return found;
			return getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : "#ffffff";
		}
		//#endregion
		//#region src/client/icons.ts
		/** Inline SVG icons and the chrome styles for the share controls. */
		/** Drag grip: six dots, used on the range marker pills. */
		function gripIconSVG() {
			return [
				"<svg width=\"8\" height=\"12\" viewBox=\"0 0 8 12\" fill=\"currentColor\" aria-hidden=\"true\">",
				"<circle cx=\"2\" cy=\"2\" r=\"1.1\"/><circle cx=\"6\" cy=\"2\" r=\"1.1\"/>",
				"<circle cx=\"2\" cy=\"6\" r=\"1.1\"/><circle cx=\"6\" cy=\"6\" r=\"1.1\"/>",
				"<circle cx=\"2\" cy=\"10\" r=\"1.1\"/><circle cx=\"6\" cy=\"10\" r=\"1.1\"/>",
				"</svg>"
			].join("");
		}
		const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
		/** Small share icon sized like the Session log button's trailing glyph. */
		function headerShareIconSVG() {
			return [
				"<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"",
				" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">",
				"<path d=\"M12 3v12\"/>",
				"<path d=\"m7 8 5-5 5 5\"/>",
				"<path d=\"M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4\"/>",
				"</svg>"
			].join("");
		}
		/**
		* The header share pill, styled like the Session log button: 13px text on a
		* transparent pill with a hairline border.
		*/
		function headerShareButtonStyle() {
			return [
				"display:inline-flex;align-items:center;gap:5px;",
				"height:32px;box-sizing:border-box;padding:0 12px;",
				"border:1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));",
				"border-radius:18px;background:transparent;",
				"color:var(--dsw-alias-label-primary, " + themeColors().labelPrimary + ");",
				"font:400 13px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;cursor:pointer;flex:none;"
			].join("");
		}
		/** Active (share mode on) variant: primary border + tinted fill + primary ink. */
		function headerShareButtonActiveStyle() {
			const c = themeColors();
			return [
				"border-color:var(--dsw-alias-state-business-primary, " + c.businessPrimary + ");",
				"background:color-mix(in srgb, var(--dsw-alias-state-business-primary, " + c.businessPrimary + ") 8%, transparent);",
				"color:var(--dsw-alias-state-business-primary, " + c.businessPrimary + ");"
			].join("");
		}
		/** Ghost 取消 button — same pill shape as the share button. */
		function ghostButtonStyle() {
			return [
				"display:inline-flex;align-items:center;justify-content:center;",
				"height:32px;box-sizing:border-box;padding:0 12px;",
				"border:1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));",
				"border-radius:18px;background:transparent;color:var(--dsw-alias-label-secondary, " + themeColors().labelSecondary + ");",
				"font:400 13px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;cursor:pointer;flex:none;"
			].join("");
		}
		/** Primary 确认 button — pill shape, same box as the share/ghost buttons. */
		function primaryButtonStyle() {
			const c = themeColors();
			return [
				"display:inline-flex;align-items:center;justify-content:center;",
				"height:32px;box-sizing:border-box;padding:0 12px;",
				"border:1px solid var(--dsw-alias-state-business-primary, " + c.businessPrimary + ");",
				"border-radius:18px;background:var(--dsw-alias-state-business-primary, " + c.businessPrimary + ");color:#ffffff;",
				"font:400 13px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;cursor:pointer;flex:none;"
			].join("");
		}
		/** Shared pill/line font stack for the marker chrome. */
		const chromeFontStack = FONT_STACK;
		//#endregion
		//#region src/client/snap-targets.ts
		const MIN_TARGET_HEIGHT = 4;
		const MAX_TARGETS = 8e3;
		/** Markdown block tags that are always snap candidates. */
		const BLOCK_TAGS = new Set([
			"P",
			"PRE",
			"UL",
			"OL",
			"LI",
			"TABLE",
			"BLOCKQUOTE",
			"H1",
			"H2",
			"H3",
			"H4",
			"H5",
			"H6"
		]);
		/** Child tags that mark an element as a layout wrapper rather than a leaf. */
		const WRAPPER_CHILD_TAGS = new Set([
			"DIV",
			"P",
			"PRE",
			"UL",
			"OL",
			"TABLE",
			"BLOCKQUOTE",
			"H1",
			"H2",
			"H3",
			"H4",
			"H5",
			"H6"
		]);
		const INTERACTIVE_SELECTOR = "button, a, [role=\"button\"], input, textarea, select, [contenteditable=\"true\"]";
		function hasDirectText(el) {
			for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE && node.textContent !== null && node.textContent.trim().length > 0) return true;
			return false;
		}
		function insideInteractive(el) {
			return el.closest(INTERACTIVE_SELECTOR) !== null;
		}
		function hasVisualBox(el) {
			const style = getComputedStyle(el);
			if (style.backgroundImage !== "none") return true;
			if (style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") return true;
			if (style.borderTopWidth !== "0px" && style.borderTopStyle !== "none") return true;
			if (parseFloat(style.paddingTop || "0") > 4) return true;
			return false;
		}
		function hasBlockChildren(el) {
			for (const child of el.children) if (WRAPPER_CHILD_TAGS.has(child.tagName)) return true;
			return false;
		}
		function isSnapTarget(el) {
			if (el.getAttribute("data-dsh-share-skip") !== null) return false;
			if (el.closest("[aria-hidden=\"true\"]") !== null) return false;
			if (el.getBoundingClientRect().height < MIN_TARGET_HEIGHT) return false;
			const selfInteractive = el.tagName === "BUTTON" || el.tagName === "A";
			if (!selfInteractive && insideInteractive(el)) return false;
			if (el.hasAttribute("data-chat-anchor-key")) return true;
			if (BLOCK_TAGS.has(el.tagName)) return true;
			if (el.tagName === "DIV") {
				if (hasDirectText(el)) return true;
				const visual = hasVisualBox(el);
				if (visual && !hasBlockChildren(el)) return true;
				if (visual && el.getBoundingClientRect().height >= 32) return true;
			}
			if (selfInteractive && hasDirectText(el) && el.getBoundingClientRect().height >= 18) return true;
			return false;
		}
		/** Distinct rendered line edges inside a text block (flow-relative). */
		function lineEdges(block, scrollTop) {
			const edges = [];
			const seen = /* @__PURE__ */ new Set();
			const range = document.createRange();
			const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
			let node = walker.nextNode();
			while (node !== null) {
				const text = node.textContent ?? "";
				if (text.trim().length > 0) try {
					range.setStart(node, 0);
					range.setEnd(node, text.length);
					for (const rect of range.getClientRects()) {
						const key = Math.round(rect.top + scrollTop);
						if (seen.has(key)) continue;
						seen.add(key);
						edges.push({
							top: rect.top + scrollTop,
							bottom: rect.top + rect.height + scrollTop
						});
					}
				} catch {}
				node = walker.nextNode();
			}
			return edges;
		}
		var SnapTargets = class {
			targets = [];
			flowList = null;
			overlay = null;
			scrollport = null;
			bind(flowList, overlay, scrollport) {
				this.flowList = flowList;
				this.overlay = overlay;
				this.scrollport = scrollport;
			}
			unbind() {
				this.flowList = null;
				this.overlay = null;
				this.scrollport = null;
				this.targets = [];
			}
			get count() {
				return this.targets.length;
			}
			/**
			* Re-scan the flow for snap targets. Call on activation and on flow mutation.
			* `fast` skips the expensive per-text-line edge pass (used while the session
			* streams, where the flow mutates every token).
			*/
			rebuild(fast = false) {
				const list = this.flowList;
				if (list === null) return;
				const overlay = this.overlay;
				const scrollTop = this.scrollport?.scrollTop ?? 0;
				const found = [];
				const seenTops = /* @__PURE__ */ new Set();
				const push = (el, top, bottom, line = false) => {
					if (found.length >= MAX_TARGETS) return;
					const key = Math.round(top);
					if (seenTops.has(key)) return;
					seenTops.add(key);
					found.push({
						el,
						top,
						bottom,
						center: (top + bottom) / 2,
						line
					});
				};
				const rows = Array.from(list.children).filter((child) => child instanceof HTMLElement && child.hasAttribute("data-chat-anchor-key"));
				for (const row of rows) {
					const rect = row.getBoundingClientRect();
					push(row, rect.top + scrollTop, rect.top + rect.height + scrollTop);
				}
				for (const row of rows) for (const el of row.querySelectorAll("div, p, pre, ul, ol, li, table, h1, h2, h3, h4, h5, h6, blockquote, button, a")) {
					if (overlay !== null && overlay.contains(el)) continue;
					if (!isSnapTarget(el)) continue;
					const rect = el.getBoundingClientRect();
					push(el, rect.top + scrollTop, rect.top + rect.height + scrollTop);
				}
				if (!fast) for (const row of rows) {
					for (const block of row.querySelectorAll("p, li, pre, h1, h2, h3, h4, h5, h6")) {
						if (insideInteractive(block)) continue;
						for (const line of lineEdges(block, scrollTop)) {
							push(block, line.top, line.bottom, true);
							if (found.length >= MAX_TARGETS) break;
						}
						if (found.length >= MAX_TARGETS) break;
					}
					if (found.length >= MAX_TARGETS) break;
				}
				found.sort((a, b) => a.top - b.top);
				this.targets = found;
			}
			/** Nearest target by vertical center distance to the given viewport y. */
			nearest(viewY) {
				const arr = this.targets;
				if (arr.length === 0) return null;
				const flowY = viewY + (this.scrollport?.scrollTop ?? 0);
				let lo = 0;
				let hi = arr.length - 1;
				while (lo < hi) {
					const mid = lo + hi >> 1;
					if (arr[mid].center < flowY) lo = mid + 1;
					else hi = mid;
				}
				let best = lo;
				if (lo > 0 && Math.abs(arr[lo - 1].center - flowY) < Math.abs(arr[lo].center - flowY)) best = lo - 1;
				if (lo + 1 < arr.length && Math.abs(arr[lo + 1].center - flowY) < Math.abs(arr[best].center - flowY)) best = lo + 1;
				return arr[best];
			}
			/** Nearest target by TOP-edge distance to the given viewport y (start marker). */
			nearestTop(viewY) {
				const arr = this.targets;
				if (arr.length === 0) return null;
				const flowY = viewY + (this.scrollport?.scrollTop ?? 0);
				let lo = 0;
				let hi = arr.length - 1;
				while (lo < hi) {
					const mid = lo + hi >> 1;
					if (arr[mid].top < flowY) lo = mid + 1;
					else hi = mid;
				}
				let best = lo;
				if (lo > 0 && Math.abs(arr[lo - 1].top - flowY) < Math.abs(arr[lo].top - flowY)) best = lo - 1;
				if (lo + 1 < arr.length && Math.abs(arr[lo + 1].top - flowY) < Math.abs(arr[best].top - flowY)) best = lo + 1;
				return arr[best];
			}
			/** Nearest target by BOTTOM-edge distance to the given viewport y (end marker). */
			nearestBottom(viewY) {
				const arr = this.targets;
				if (arr.length === 0) return null;
				const flowY = viewY + (this.scrollport?.scrollTop ?? 0);
				let lo = 0;
				let hi = arr.length - 1;
				while (lo < hi) {
					const mid = lo + hi >> 1;
					if (arr[mid].bottom < flowY) lo = mid + 1;
					else hi = mid;
				}
				let best = lo;
				if (lo > 0 && Math.abs(arr[lo - 1].bottom - flowY) < Math.abs(arr[lo].bottom - flowY)) best = lo - 1;
				if (lo + 1 < arr.length && Math.abs(arr[lo + 1].bottom - flowY) < Math.abs(arr[best].bottom - flowY)) best = lo + 1;
				return arr[best];
			}
			indexOf(el) {
				for (let i = 0; i < this.targets.length; i++) if (this.targets[i].el === el) return i;
				return -1;
			}
		};
		//#endregion
		//#region src/client/markers.ts
		/**
		* Range-marker overlay for the chat flow.
		*
		* Two handles mark "从这里开始" / "到这里结束". Dragging a handle follows the
		* cursor 1:1 inside the viewport; when the pointer enters the top/bottom edge
		* zone the page auto-scrolls. When the line comes near a snap target edge
		* (row/block/line) it magnetically latches onto it, and drags beyond the
		* release distance unlatch it back to the free state. Releasing while latched
		* anchors the handle to that edge (it rides the content on scroll); releasing
		* while free leaves it floating at that screen position. The two handles can
		* never cross.
		*/
		/** Magnet engages when the line is within this distance of an element edge. */
		const SNAP_IN = 20;
		/** Magnet releases when dragged further than this from the element edge. */
		const SNAP_OUT = 32;
		const EDGE_MARGIN = 8;
		/** Gap between the pill's right edge and the flow content's left edge. */
		const GUTTER_GAP = 8;
		/** Pointer bands at the overlay top/bottom that drive page auto-scroll. */
		const EDGE_ZONE = 64;
		/** Auto-scroll base speed (px per 60fps frame). */
		const EDGE_SCROLL_BASE = 4;
		/** Auto-scroll speed ramp as the pointer sinks deeper into the edge zone. */
		const EDGE_SCROLL_RAMP = 10;
		/** Minimum pointer travel before edge auto-scroll engages (click != drag). */
		const MIN_DRAG_FOR_EDGE_SCROLL = 8;
		/** Highlight-registry name and style id for the text dim (CSS Custom Highlight API). */
		const DIM_HIGHLIGHT_NAME = "dsh-share-dim";
		const DIM_STYLE_ID = "dsh-share-dim-style";
		/** Arrow-key nudge step, overlay px. */
		const NUDGE_PX = 8;
		/** Minimum interval between snap-target rebuilds while the session streams. */
		const STREAM_REBUILD_MIN_MS = 1e3;
		function clamp(value, min, max) {
			return Math.min(Math.max(value, min), Math.max(min, max));
		}
		var MarkerOverlay = class {
			root = null;
			scrollport = null;
			flowList = null;
			targets = new SnapTargets();
			handles = [];
			drag = null;
			onDetach;
			disposed = false;
			syncPending = false;
			rebuildPending = false;
			listeners = [];
			flowObserver = null;
			detachObserver = null;
			rect = {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			};
			outlined = null;
			/** Last pointer y (viewport) for the edge auto-scroll loop. */
			lastPointerY = 0;
			edgeScrollActive = false;
			lastDimStartEdge = -1;
			lastDimEndEdge = -1;
			lastDimScrollTop = -1;
			/** Per-line text Ranges + their flow-relative bounds (highlight API, no DOM mutation). */
			dimLines = [];
			ghostStart = null;
			ghostEnd = null;
			/** Overlay mounted inside the flow content so snapped lines scroll natively. */
			contentRoot = null;
			prevFlowListPosition = "";
			isStreaming;
			rebuildTimer = null;
			lastRebuildAt = 0;
			constructor(options) {
				this.onDetach = options.onDetach;
				this.isStreaming = options.isStreaming;
			}
			activate(scrollport, flowList) {
				if (this.disposed) return;
				this.scrollport = scrollport;
				this.flowList = flowList;
				const vars = themeColors();
				const root = document.createElement("div");
				root.style.cssText = ["position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;", "pointer-events:none;z-index:6;"].join("");
				this.root = root;
				this.targets.bind(flowList, root, scrollport);
				this.prevFlowListPosition = flowList.style.position;
				flowList.style.position = "relative";
				this.contentRoot = document.createElement("div");
				this.contentRoot.style.cssText = ["position:absolute;left:0;top:0;width:0;height:0;overflow:visible;", "pointer-events:none;z-index:6;"].join("");
				flowList.append(this.contentRoot);
				this.ghostStart = this.createGhost(root);
				this.ghostEnd = this.createGhost(root);
				const start = this.createHandle(root, "start", vars.businessPrimary, vars.borderL2, vars.bgRaise, vars.labelSecondary);
				const end = this.createHandle(root, "end", vars.businessPrimary, vars.borderL2, vars.bgRaise, vars.labelSecondary);
				this.handles.push(start, end);
				document.body.append(root);
				this.syncGeometry();
				const bottom = this.effectiveBottom();
				start.freeY = EDGE_MARGIN;
				end.freeY = Math.max(EDGE_MARGIN, bottom - EDGE_MARGIN);
				this.targets.rebuild();
				this.ensureDimStyle();
				this.collectDimLines();
				const onScroll = () => {
					this.syncSnappedHandles();
					this.scheduleSync();
				};
				const onResize = () => this.scheduleSync();
				scrollport.addEventListener("scroll", onScroll, { passive: true });
				window.addEventListener("resize", onResize);
				this.listeners.push(() => {
					scrollport.removeEventListener("scroll", onScroll);
					window.removeEventListener("resize", onResize);
				});
				const onKeydown = (event) => {
					if (event.key === "Escape") {
						event.preventDefault();
						this.dispose();
						this.onDetach();
						return;
					}
					if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
					const active = document.activeElement;
					let handle = null;
					const startH = this.handles[0];
					const endH = this.handles[1];
					if (active === startH?.pill) handle = startH;
					else if (active === endH?.pill) handle = endH;
					if (handle === null) return;
					event.preventDefault();
					this.nudge(handle, event.key === "ArrowUp" ? -8 : NUDGE_PX);
				};
				window.addEventListener("keydown", onKeydown);
				this.listeners.push(() => window.removeEventListener("keydown", onKeydown));
				const flowObserver = new MutationObserver(() => this.scheduleRebuild());
				this.flowObserver = flowObserver;
				flowObserver.observe(flowList, {
					childList: true,
					subtree: true
				});
				const detachObserver = new MutationObserver(() => this.scheduleSync());
				this.detachObserver = detachObserver;
				detachObserver.observe(scrollport, {
					childList: true,
					subtree: true
				});
				this.sync();
			}
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				this.flowObserver?.disconnect();
				this.detachObserver?.disconnect();
				for (const off of this.listeners) off();
				this.listeners.length = 0;
				this.clearOutline();
				this.clearDim();
				this.edgeScrollActive = false;
				if (this.rebuildTimer !== null) {
					window.clearTimeout(this.rebuildTimer);
					this.rebuildTimer = null;
				}
				this.contentRoot?.remove();
				this.contentRoot = null;
				if (this.flowList !== null) this.flowList.style.position = this.prevFlowListPosition;
				this.root?.remove();
				this.root = null;
				this.ghostStart = null;
				this.ghostEnd = null;
				this.scrollport = null;
				this.flowList = null;
				this.handles.length = 0;
				this.drag = null;
				this.targets.unbind();
			}
			/** Resolve the current range: snapped targets, else nearest under each line. */
			currentRange() {
				const [start, end] = this.handles;
				if (start === void 0 || end === void 0) return null;
				let s = start.state === "snapped" ? start.snappedTarget : null;
				let e = end.state === "snapped" ? end.snappedTarget : null;
				if (s === null) s = this.targets.nearestTop(this.rect.top + this.lineY(start));
				if (e === null) e = this.targets.nearestBottom(this.rect.top + this.lineY(end));
				if (s === null || e === null) return null;
				const startEdge = Math.min(s.top, e.top);
				const endEdge = Math.max(s.bottom, e.bottom);
				return {
					startEl: s.top <= e.top ? s.el : e.el,
					startEdge,
					endEl: s.top <= e.top ? e.el : s.el,
					endEdge
				};
			}
			/** Dashed projection of where a free handle would snap on confirm. */
			createGhost(root) {
				const el = document.createElement("div");
				el.style.cssText = [
					"position:absolute;left:0;top:0;height:0;width:100%;display:none;",
					"border-top:1px dashed var(--dsw-alias-state-business-primary, #3964fe);",
					"opacity:.45;pointer-events:none;"
				].join("");
				root.append(el);
				return el;
			}
			createHandle(root, kind, primary, border, bgRaise, label) {
				const line = document.createElement("div");
				line.style.cssText = ["position:absolute;height:2px;border-radius:1px;pointer-events:none;", "background:var(--dsw-alias-state-business-primary, " + primary + ");"].join("");
				const pill = document.createElement("button");
				pill.type = "button";
				pill.style.cssText = [
					"position:absolute;display:flex;flex-direction:row;align-items:center;gap:5px;",
					"padding:3px 8px;box-sizing:border-box;white-space:nowrap;",
					"border-radius:999px;border:1px solid var(--dsw-alias-border-l2, " + border + ");",
					"background:var(--dsw-alias-bg-layer-2, " + bgRaise + ");",
					"color:var(--dsw-alias-label-secondary, " + label + ");",
					"cursor:grab;touch-action:none;user-select:none;",
					"pointer-events:auto;transition:transform 90ms ease;"
				].join("");
				const grip = document.createElement("span");
				grip.style.cssText = "display:inline-flex;opacity:.65;";
				grip.innerHTML = gripIconSVG();
				const labelSpan = document.createElement("span");
				labelSpan.style.cssText = "font:500 12px/16px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;";
				labelSpan.textContent = kind === "start" ? "从这里开始" : "到这里结束";
				pill.append(grip, labelSpan);
				root.append(line, pill);
				const handle = {
					kind,
					state: "free",
					freeY: 0,
					snappedTarget: null,
					flowOffset: 0,
					pill,
					line
				};
				pill.addEventListener("pointerdown", (event) => this.onPointerDown(event, handle));
				pill.addEventListener("pointermove", (event) => this.onPointerMove(event));
				pill.addEventListener("pointerup", (event) => this.onPointerUp(event));
				pill.addEventListener("pointercancel", (event) => this.onPointerUp(event));
				return handle;
			}
			syncGeometry() {
				const scrollport = this.scrollport;
				const root = this.root;
				if (scrollport === null || root === null) return;
				const rect = scrollport.getBoundingClientRect();
				this.rect = {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height
				};
				root.style.left = `${rect.left}px`;
				root.style.top = `${rect.top}px`;
				root.style.width = `${rect.width}px`;
				root.style.height = `${rect.height}px`;
			}
			/** Bottom of the interactive handle area (above the sticky composer seat). */
			effectiveBottom() {
				const scrollport = this.scrollport;
				if (scrollport === null) return this.rect.height;
				const seat = findComposerSeat(scrollport);
				if (seat === null) return this.rect.height;
				return clamp(seat.getBoundingClientRect().top - this.rect.top, 0, this.rect.height);
			}
			/** The flow content box in overlay coordinates. */
			contentBox() {
				const flowList = this.flowList;
				if (flowList === null) return {
					left: 12,
					width: Math.max(0, this.rect.width - 24)
				};
				const rect = flowList.getBoundingClientRect();
				return {
					left: rect.left - this.rect.left,
					width: rect.width
				};
			}
			scheduleSync() {
				if (this.syncPending) return;
				this.syncPending = true;
				requestAnimationFrame(() => {
					this.syncPending = false;
					if (!this.disposed) this.sync();
				});
			}
			/**
			* Lightweight synchronous reposition of snapped handles (lines + pills) on
			* scroll, so they track the content in the same frame instead of lagging a
			* frame behind the rAF-debounced full sync. Free handles are intentionally
			* skipped here — they stay screen-fixed and are handled by sync().
			*/
			syncSnappedHandles() {
				if (this.disposed || this.root === null || this.scrollport === null) return;
				if (!this.handles.some((handle) => handle.state === "snapped")) return;
				const rect = this.scrollport.getBoundingClientRect();
				this.rect = {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height
				};
				const box = this.contentBox();
				const bottom = this.effectiveBottom();
				for (const handle of this.handles) {
					if (handle.state !== "snapped") continue;
					this.positionHandle(handle, this.lineY(handle), box, bottom);
				}
			}
			scheduleRebuild() {
				if (this.rebuildPending) return;
				this.rebuildPending = true;
				requestAnimationFrame(() => {
					this.rebuildPending = false;
					if (this.disposed) return;
					const streaming = this.isStreaming();
					const since = Date.now() - this.lastRebuildAt;
					const min = streaming ? STREAM_REBUILD_MIN_MS : 0;
					if (since < min) {
						if (this.rebuildTimer === null) this.rebuildTimer = window.setTimeout(() => {
							this.rebuildTimer = null;
							this.scheduleRebuild();
						}, min - since);
						return;
					}
					this.lastRebuildAt = Date.now();
					this.clearDim();
					this.targets.rebuild(streaming);
					this.collectDimLines();
					this.sync();
				});
			}
			sync() {
				if (this.disposed || this.root === null || this.scrollport === null) return;
				const flowList = this.flowList;
				if (flowList !== null && !flowList.isConnected) {
					this.dispose();
					this.onDetach();
					return;
				}
				if (this.contentRoot !== null && !this.contentRoot.isConnected && flowList !== null) {
					flowList.append(this.contentRoot);
					for (const handle of this.handles) if (handle.state === "snapped") this.snapLine(handle);
				}
				this.syncGeometry();
				const bottom = this.effectiveBottom();
				const box = this.contentBox();
				const [start, end] = this.handles;
				if (start === void 0 || end === void 0) return;
				const endY = this.lineY(end);
				if (start.state === "free") start.freeY = clamp(start.freeY, 0, Math.max(0, endY));
				const startY = this.lineY(start);
				if (end.state === "free") end.freeY = clamp(end.freeY, Math.max(0, startY), bottom);
				const sy = this.lineY(start);
				const ey = this.lineY(end);
				this.positionHandle(start, sy, box, bottom);
				this.positionHandle(end, ey, box, bottom);
				this.syncDim();
				this.syncGhosts(start, end, box);
			}
			/**
			* Build per-line text Ranges with flow-relative bounds for the whole flow.
			* Uses the CSS Custom Highlight API (zero DOM mutation), so snap collection —
			* which reads block segments straight off the DOM — is never disturbed.
			*/
			collectDimLines() {
				const flowList = this.flowList;
				if (flowList === null) return;
				this.dimLines = [];
				const scrollTop = this.scrollport?.scrollTop ?? 0;
				const walker = document.createTreeWalker(flowList, NodeFilter.SHOW_TEXT);
				let node = walker.nextNode();
				while (node !== null) {
					if (node instanceof Text && (node.textContent ?? "").trim().length > 0) this.dimLines.push(...this.textNodeLineRanges(node, scrollTop));
					node = walker.nextNode();
				}
			}
			/** Per-rendered-line Ranges of one text node, with flow-relative bounds. */
			textNodeLineRanges(node, scrollTop) {
				const text = node.textContent ?? "";
				const probe = document.createRange();
				probe.selectNodeContents(node);
				const rects = Array.from(probe.getClientRects());
				if (rects.length === 0) return [];
				if (rects.length === 1) {
					const lineRange = document.createRange();
					lineRange.setStart(node, 0);
					lineRange.setEnd(node, text.length);
					const rect = rects[0];
					return [{
						range: lineRange,
						top: rect.top + scrollTop,
						bottom: rect.bottom + scrollTop
					}];
				}
				const bounds = this.lineBreakOffsets(node, text, rects);
				const result = [];
				let prev = 0;
				for (let i = 0; i <= bounds.length; i++) {
					const end = i < bounds.length ? bounds[i] : text.length;
					if (end <= prev) continue;
					const lineRange = document.createRange();
					lineRange.setStart(node, prev);
					lineRange.setEnd(node, end);
					const rect = rects[i];
					if (rect !== void 0) result.push({
						range: lineRange,
						top: rect.top + scrollTop,
						bottom: rect.bottom + scrollTop
					});
					prev = end;
				}
				return result;
			}
			/** Character offsets where each rendered line after the first begins. */
			lineBreakOffsets(node, text, rects) {
				const probe = document.createRange();
				const bounds = [];
				for (let i = 1; i < rects.length; i++) {
					const targetTop = rects[i].top;
					let lo = 0;
					let hi = text.length;
					while (lo < hi) {
						const mid = lo + hi >> 1;
						probe.setStart(node, mid);
						probe.setEnd(node, mid + 1);
						if (probe.getBoundingClientRect().top < targetTop - .5) lo = mid + 1;
						else hi = mid;
					}
					bounds.push(lo);
				}
				return bounds;
			}
			/** Ensure the ::highlight(dsh-share-dim) rule exists and uses the theme gray. */
			ensureDimStyle() {
				let style = document.getElementById(DIM_STYLE_ID);
				if (style === null) {
					style = document.createElement("style");
					style.id = DIM_STYLE_ID;
					document.head.append(style);
				}
				style.textContent = `::highlight(${DIM_HIGHLIGHT_NAME}) { color: ${themeColors().labelTertiary}; }`;
			}
			/** Paint the outside lines gray via the Custom Highlight API (no DOM mutation). */
			applyDim(startEdge, endEdge) {
				const registry = CSS.highlights;
				const HighlightCtor = window.Highlight;
				if (registry === void 0 || HighlightCtor === void 0) return;
				const highlight = new HighlightCtor();
				for (const line of this.dimLines) if (line.bottom <= startEdge || line.top >= endEdge) highlight.add(line.range);
				registry.set(DIM_HIGHLIGHT_NAME, highlight);
			}
			/** Gray out text lines outside the selected range (line-precise, no overlay). */
			syncDim() {
				const range = this.currentRange();
				if (range === null) {
					this.clearDim();
					return;
				}
				const scrollTop = this.scrollport?.scrollTop ?? 0;
				if (range.startEdge === this.lastDimStartEdge && range.endEdge === this.lastDimEndEdge && scrollTop === this.lastDimScrollTop) return;
				this.lastDimStartEdge = range.startEdge;
				this.lastDimEndEdge = range.endEdge;
				this.lastDimScrollTop = scrollTop;
				this.applyDim(range.startEdge, range.endEdge);
			}
			clearDim() {
				CSS.highlights?.delete(DIM_HIGHLIGHT_NAME);
				this.lastDimStartEdge = -1;
				this.lastDimEndEdge = -1;
				this.lastDimScrollTop = -1;
			}
			/** Project the confirm-time snap edge as a dashed ghost for free handles. */
			syncGhosts(start, end, box) {
				const scrollTop = this.scrollport?.scrollTop ?? 0;
				this.placeGhost(this.ghostStart, start, box, scrollTop);
				this.placeGhost(this.ghostEnd, end, box, scrollTop);
			}
			placeGhost(ghost, handle, box, scrollTop) {
				if (ghost === null) return;
				if (handle.state === "snapped") {
					ghost.style.display = "none";
					return;
				}
				const viewY = this.rect.top + this.lineY(handle);
				const target = handle.kind === "end" ? this.targets.nearestBottom(viewY) : this.targets.nearestTop(viewY);
				if (target === null) {
					ghost.style.display = "none";
					return;
				}
				const edge = handle.kind === "end" ? target.bottom : target.top;
				const y = Math.round(edge - scrollTop - this.rect.top);
				ghost.style.display = "block";
				ghost.style.left = `${box.left}px`;
				ghost.style.width = `${box.width}px`;
				ghost.style.top = `${y}px`;
			}
			lineY(handle) {
				if (handle.state === "snapped" && handle.snappedTarget !== null) {
					const target = handle.snappedTarget;
					if (target.line) return (handle.kind === "end" ? target.bottom : target.top) - (this.scrollport?.scrollTop ?? 0) - this.rect.top;
					const rect = target.el.getBoundingClientRect();
					return (handle.kind === "end" ? rect.bottom : rect.top) - this.rect.top;
				}
				return handle.freeY;
			}
			/** Content-relative y of a snapped edge, measured against the content overlay. */
			flowOffsetOf(handle) {
				const target = handle.snappedTarget;
				const contentRoot = this.contentRoot;
				if (target === null || contentRoot === null) return 0;
				const rootTop = contentRoot.getBoundingClientRect().top;
				if (target.line) return (handle.kind === "end" ? target.bottom : target.top) - (rootTop + (this.scrollport?.scrollTop ?? 0));
				const rect = target.el.getBoundingClientRect();
				return (handle.kind === "end" ? rect.bottom : rect.top) - rootTop;
			}
			/** Move a handle's line into the content overlay and lock its flow offset. */
			snapLine(handle) {
				if (this.contentRoot === null) return;
				handle.flowOffset = this.flowOffsetOf(handle);
				this.contentRoot.append(handle.line);
			}
			/** Move a handle's line back into the fixed overlay (free-floating). */
			unsnapLine(handle) {
				if (this.root === null) return;
				this.root.append(handle.line);
			}
			positionHandle(handle, y, box, bottom) {
				const ry = y;
				if (handle.state === "snapped") {
					handle.line.style.left = "0px";
					handle.line.style.width = `${box.width}px`;
					handle.line.style.top = `${handle.flowOffset}px`;
				} else {
					handle.line.style.left = `${box.left}px`;
					handle.line.style.top = `${ry}px`;
					handle.line.style.width = `${box.width}px`;
				}
				const pillWidth = handle.pill.offsetWidth || 86;
				const pillHeight = handle.pill.offsetHeight || 24;
				const gutterX = box.left - pillWidth - GUTTER_GAP;
				handle.pill.style.left = `${Math.max(4, gutterX)}px`;
				const maxTop = Math.max(4, bottom - pillHeight);
				const pillTop = handle.kind === "start" ? ry - pillHeight : ry;
				handle.pill.style.top = `${clamp(pillTop, 4, maxTop)}px`;
			}
			onPointerDown(event, handle) {
				if (this.disposed) return;
				event.preventDefault();
				handle.pill.focus({ preventScroll: true });
				try {
					handle.pill.setPointerCapture(event.pointerId);
				} catch {}
				this.edgeScrollActive = false;
				this.lastPointerY = event.clientY;
				this.drag = {
					handle,
					pointerId: event.pointerId,
					lastPointerY: event.clientY,
					grabOffsetY: this.lineY(handle) - (event.clientY - this.rect.top),
					movedDistance: 0,
					attached: null,
					moved: false
				};
				this.sync();
			}
			onPointerMove(event) {
				const drag = this.drag;
				if (drag === null || event.pointerId !== drag.pointerId) return;
				const dy = event.clientY - drag.lastPointerY;
				if (Math.abs(dy) > .5) drag.moved = true;
				drag.movedDistance += Math.abs(dy);
				drag.lastPointerY = event.clientY;
				this.lastPointerY = event.clientY;
				const handle = drag.handle;
				const bottom = this.effectiveBottom();
				if (handle.state === "snapped") {
					handle.state = "free";
					handle.snappedTarget = null;
					handle.freeY = this.lineY(handle);
					this.unsnapLine(handle);
					this.clearOutline();
				}
				const pointerY = event.clientY - this.rect.top;
				const inTopZone = pointerY <= EDGE_ZONE;
				const inBottomZone = pointerY >= this.rect.height - EDGE_ZONE;
				if (inTopZone) handle.freeY = 0;
				else if (inBottomZone) handle.freeY = bottom;
				else handle.freeY = clamp(pointerY - drag.grabOffsetY, 0, bottom);
				this.applyMagnet(drag);
				this.sync();
				this.ensureEdgeScroll();
			}
			onPointerUp(event) {
				const drag = this.drag;
				if (drag === null || event.pointerId !== drag.pointerId) return;
				this.edgeScrollActive = false;
				const handle = drag.handle;
				if (drag.attached !== null) {
					handle.state = "snapped";
					handle.snappedTarget = drag.attached;
					handle.freeY = this.targetToFreeY(handle, drag.attached);
					this.snapLine(handle);
				} else {
					handle.state = "free";
					handle.snappedTarget = null;
					this.unsnapLine(handle);
				}
				this.drag = null;
				this.setAttachedVisual(null);
				this.sync();
			}
			/** Keyboard nudge: move a handle by `delta` and latch it when it lands on a target. */
			nudge(handle, delta) {
				if (this.disposed) return;
				if (handle.state === "snapped") {
					const currentY = this.lineY(handle);
					handle.state = "free";
					handle.snappedTarget = null;
					handle.freeY = currentY;
					this.unsnapLine(handle);
					this.clearOutline();
				}
				const bottom = this.effectiveBottom();
				handle.freeY = clamp(handle.freeY + delta, 0, bottom);
				const viewY = this.rect.top + handle.freeY;
				const target = handle.kind === "end" ? this.targets.nearestBottom(viewY) : this.targets.nearestTop(viewY);
				if (target !== null) {
					const scrollTop = this.scrollport?.scrollTop ?? 0;
					const edge = handle.kind === "end" ? target.bottom : target.top;
					if (Math.abs(edge - (viewY + scrollTop)) <= SNAP_IN) {
						handle.state = "snapped";
						handle.snappedTarget = target;
						handle.freeY = this.targetToFreeY(handle, target);
						this.snapLine(handle);
					}
				}
				this.sync();
			}
			/** Convert a flow-relative target edge to overlay-local y at the live scroll. */
			targetToFreeY(handle, target) {
				const scrollTop = this.scrollport?.scrollTop ?? 0;
				return (handle.kind === "end" ? target.bottom : target.top) - scrollTop - this.rect.top;
			}
			/** Magnetic latch: attach near an element edge, release beyond the hysteresis distance. */
			applyMagnet(drag) {
				const handle = drag.handle;
				const viewY = this.rect.top + handle.freeY;
				const target = handle.kind === "end" ? this.targets.nearestBottom(viewY) : this.targets.nearestTop(viewY);
				if (target === null) {
					if (drag.attached !== null) this.setAttachedVisual(null);
					drag.attached = null;
					return;
				}
				const lineFlowY = viewY + (this.scrollport?.scrollTop ?? 0);
				const targetEdgeFlow = handle.kind === "end" ? target.bottom : target.top;
				const distance = Math.abs(targetEdgeFlow - lineFlowY);
				const current = drag.attached;
				if (current !== null && current.el === target.el) {
					drag.attached = target;
					handle.freeY = this.targetToFreeY(handle, target);
					return;
				}
				if (distance <= SNAP_IN) {
					const latchY = this.targetToFreeY(handle, target);
					if (latchY < 0 || latchY > this.effectiveBottom()) {
						if (current !== null) {
							drag.attached = null;
							this.setAttachedVisual(null);
						}
						return;
					}
					drag.attached = target;
					handle.freeY = latchY;
					this.setAttachedVisual(target.el);
				} else if (current !== null && distance > SNAP_OUT) {
					drag.attached = null;
					this.setAttachedVisual(null);
				}
			}
			/** Auto-scroll while the pointer is held in the top/bottom edge zones. */
			ensureEdgeScroll() {
				if (this.edgeScrollActive) return;
				this.edgeScrollActive = true;
				let last = performance.now();
				const step = (now) => {
					if (!this.edgeScrollActive || this.drag === null || this.scrollport === null || this.disposed) {
						this.edgeScrollActive = false;
						return;
					}
					const dt = Math.min(2, (now - last) / 16.667);
					last = now;
					const height = this.rect.height;
					const y = this.lastPointerY - this.rect.top;
					let speed = 0;
					if (this.drag.movedDistance >= MIN_DRAG_FOR_EDGE_SCROLL) {
						if (y <= EDGE_ZONE) speed = -(EDGE_SCROLL_BASE + clamp((EDGE_ZONE - y) / EDGE_ZONE, 0, 1) * EDGE_SCROLL_RAMP);
						else if (y >= height - EDGE_ZONE) speed = EDGE_SCROLL_BASE + clamp((y - (height - EDGE_ZONE)) / EDGE_ZONE, 0, 1) * EDGE_SCROLL_RAMP;
					}
					if (speed !== 0) {
						const maxScroll = this.scrollport.scrollHeight - this.scrollport.clientHeight;
						if (maxScroll > 0) {
							this.scrollport.scrollTop = clamp(this.scrollport.scrollTop + speed * dt, 0, maxScroll);
							this.sync();
						}
					}
					requestAnimationFrame(step);
				};
				requestAnimationFrame(step);
			}
			setAttachedVisual(el) {
				const drag = this.drag;
				if (drag !== null) {
					const primary = themeColors().businessPrimary;
					drag.handle.pill.style.transform = el === null ? "" : "scale(1.04)";
					drag.handle.pill.style.borderColor = el === null ? "" : `var(--dsw-alias-state-business-primary, ${primary})`;
				}
				this.clearOutline();
				if (el !== null) {
					const primary = themeColors().businessPrimary;
					const computedRadius = getComputedStyle(el).borderRadius;
					const radius = computedRadius === "0px" ? "8px" : computedRadius;
					this.outlined = {
						el,
						boxShadow: el.style.boxShadow,
						borderRadius: el.style.borderRadius
					};
					el.style.boxShadow = `inset 0 0 0 999px color-mix(in srgb, var(--dsw-alias-state-business-primary, ${primary}) 9%, transparent)`;
					el.style.borderRadius = radius;
				}
			}
			clearOutline() {
				if (this.outlined !== null) {
					this.outlined.el.style.boxShadow = this.outlined.boxShadow;
					this.outlined.el.style.borderRadius = this.outlined.borderRadius;
					this.outlined = null;
				}
			}
		};
		//#endregion
		//#region src/client/toast.ts
		/** Minimal transient toast used for share-flow notices. */
		let current = null;
		let timer = null;
		function showToast(message, durationMs = 4200) {
			if (current !== null) current.remove();
			if (timer !== null) window.clearTimeout(timer);
			const c = themeColors();
			const el = document.createElement("div");
			el.setAttribute("role", "status");
			el.textContent = message;
			el.style.cssText = [
				"position:fixed;right:24px;bottom:96px;z-index:1001;max-width:min(360px,calc(100vw - 48px));",
				"padding:10px 14px;border-radius:10px;",
				"background:var(--dsw-alias-toast-bg, " + c.labelPrimary + ");",
				"color:var(--dsw-alias-bg-base, " + c.bgBase + ");",
				"font:400 13px/18px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;",
				"box-shadow:0 4px 16px rgb(0 0 0 / 20%);opacity:0;transition:opacity 160ms ease;"
			].join("");
			document.body.append(el);
			el.offsetHeight;
			el.style.opacity = "1";
			current = el;
			if (durationMs <= 0) {
				timer = null;
				return;
			}
			timer = window.setTimeout(() => {
				el.style.opacity = "0";
				window.setTimeout(() => el.remove(), 180);
				current = null;
				timer = null;
			}, durationMs);
		}
		/** Immediately clear any visible toast (e.g. when the awaited work completes). */
		function dismissToast() {
			if (timer !== null) window.clearTimeout(timer);
			timer = null;
			if (current !== null) {
				current.style.opacity = "0";
				window.setTimeout(() => current?.remove(), 180);
				current = null;
			}
		}
		//#endregion
		//#region src/client/modal.ts
		/** Preview modal with a download button for the generated PNG. */
		function timestamp() {
			const now = /* @__PURE__ */ new Date();
			const pad = (value) => String(value).padStart(2, "0");
			return [
				now.getFullYear(),
				pad(now.getMonth() + 1),
				pad(now.getDate()),
				"-",
				pad(now.getHours()),
				pad(now.getMinutes()),
				pad(now.getSeconds())
			].join("");
		}
		/** Strip characters illegal in filenames and cap length for a safe download name. */
		function sanitizeFilename(title) {
			return title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
		}
		var PreviewModal = class {
			root = null;
			show(output, title = "") {
				this.hide();
				const vars = themeColors();
				const root = document.createElement("div");
				root.style.cssText = ["position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;", "background:rgb(0 0 0 / 45%);padding:32px;"].join("");
				const panel = document.createElement("div");
				panel.style.cssText = [
					"display:flex;flex-direction:column;gap:14px;max-width:min(860px,100%);max-height:100%;",
					"padding:18px;border-radius:14px;",
					"background:var(--dsw-alias-bg-base, " + vars.bgBase + ");",
					"border:1px solid var(--dsw-alias-border-l2, " + vars.borderL2 + ");",
					"box-shadow:0 12px 40px rgb(0 0 0 / 28%);"
				].join("");
				const header = document.createElement("div");
				header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;flex:none;";
				const titleEl = document.createElement("div");
				titleEl.textContent = `对话分享截图 · ${output.width}×${output.height}px`;
				titleEl.style.cssText = `font:600 14px/20px ${chromeFontStack};color:var(--dsw-alias-label-primary, ${vars.labelPrimary});`;
				const close = document.createElement("button");
				close.type = "button";
				close.textContent = "✕";
				close.setAttribute("aria-label", "关闭预览");
				close.style.cssText = [
					"width:24px;height:24px;border:none;border-radius:6px;background:transparent;",
					"color:var(--dsw-alias-label-secondary, " + vars.labelSecondary + ");cursor:pointer;",
					"font:500 14px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;flex:none;"
				].join("");
				header.append(titleEl, close);
				const scroll = document.createElement("div");
				scroll.style.cssText = "overflow:auto;flex:1 1 auto;min-height:0;padding:16px;background:transparent;";
				const image = document.createElement("img");
				image.src = output.dataUrl;
				image.alt = "对话分享截图";
				image.style.cssText = "max-width:100%;height:auto;display:block;margin:0 auto;border-radius:6px;box-shadow:0 2px 12px rgb(0 0 0 / 16%);";
				scroll.append(image);
				const actions = document.createElement("div");
				actions.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:none;";
				const copy = document.createElement("button");
				copy.type = "button";
				copy.textContent = "复制图片";
				copy.style.cssText = [
					"padding:7px 18px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2, " + vars.borderL2 + ");",
					"background:transparent;color:var(--dsw-alias-label-secondary, " + vars.labelSecondary + ");",
					"font:500 13px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;cursor:pointer;"
				].join("");
				copy.addEventListener("click", () => {
					this.copy(output.dataUrl);
				});
				const download = document.createElement("a");
				download.href = output.dataUrl;
				const safeTitle = sanitizeFilename(title);
				download.download = safeTitle === "" ? `对话分享-${timestamp()}.png` : `对话分享-${safeTitle}-${timestamp()}.png`;
				download.textContent = "下载 PNG";
				download.style.cssText = [
					"padding:7px 18px;border-radius:8px;text-decoration:none;",
					"background:var(--dsw-alias-state-business-primary, " + vars.businessPrimary + ");color:#fff;",
					"font:500 13px/20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;cursor:pointer;"
				].join("");
				actions.append(copy, download);
				panel.append(header, scroll, actions);
				root.append(panel);
				document.body.append(root);
				this.root = root;
				const dismiss = () => this.hide();
				close.addEventListener("click", dismiss);
				root.addEventListener("pointerdown", (event) => {
					if (event.target === root) dismiss();
				});
				const onKey = (event) => {
					if (event.key === "Escape") dismiss();
				};
				window.addEventListener("keydown", onKey, { once: true });
			}
			/** Copy the PNG to the clipboard via the async Clipboard API. */
			async copy(dataUrl) {
				try {
					const ItemClass = window.ClipboardItem;
					const clipboard = navigator.clipboard;
					if (clipboard === void 0 || ItemClass === void 0) throw new Error("当前浏览器不支持剪贴板图片");
					const blob = await (await fetch(dataUrl)).blob();
					await clipboard.write([new ItemClass({ "image/png": blob })]);
					showToast("已复制到剪贴板");
				} catch {
					showToast("复制失败，请使用「下载 PNG」");
				}
			}
			hide() {
				this.root?.remove();
				this.root = null;
			}
		};
		//#endregion
		//#region src/client/controller.ts
		const ACTIONS_CLASS = "dsh-share-tabs-actions";
		var ShareController = class {
			ctx;
			modal = new PreviewModal();
			observer = null;
			utilities = null;
			/** The Session log button's computed border, copied so the share pill matches. */
			logBorder = "";
			actionsRow = null;
			shareButton = null;
			cancelButton = null;
			confirmButton = null;
			overlay = null;
			active = false;
			disposed = false;
			constructor(ctx) {
				this.ctx = ctx;
			}
			attach() {
				this.observer = new MutationObserver(() => this.syncButton());
				this.observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				this.syncButton();
			}
			dispose() {
				this.disposed = true;
				this.observer?.disconnect();
				this.observer = null;
				this.deactivate();
				this.teardownButton();
				this.modal.hide();
			}
			syncButton() {
				if (this.disposed) return;
				const utilities = findHeaderUtilities();
				if (utilities === null) {
					if (this.active) this.deactivate();
					this.teardownButton();
					return;
				}
				if (this.utilities === utilities && this.shareButton !== null && utilities.contains(this.shareButton)) return;
				if (this.active) this.deactivate();
				this.teardownButton();
				this.buildButton(utilities);
			}
			buildButton(utilities) {
				const row = document.createElement("div");
				row.className = ACTIONS_CLASS;
				row.style.cssText = "display:flex;align-items:center;gap:6px;flex:none;";
				const share = document.createElement("button");
				share.type = "button";
				share.title = "分享对话截图";
				share.setAttribute("aria-label", "分享对话截图");
				share.style.cssText = headerShareButtonStyle();
				share.innerHTML = headerShareIconSVG() + "<span>分享</span>";
				share.addEventListener("click", () => this.toggle());
				row.append(share);
				const logBtn = Array.from(utilities.querySelectorAll("button")).find((b) => /session\s*log/i.test((b.textContent ?? "").trim()));
				if (logBtn !== void 0) {
					this.logBorder = getComputedStyle(logBtn).border;
					share.style.border = this.logBorder;
				}
				utilities.insertBefore(row, utilities.firstChild);
				this.utilities = utilities;
				this.actionsRow = row;
				this.shareButton = share;
			}
			teardownButton() {
				this.actionsRow?.remove();
				this.actionsRow = null;
				this.shareButton = null;
				this.cancelButton = null;
				this.confirmButton = null;
				this.utilities = null;
			}
			toggle() {
				if (this.active) this.deactivate();
				else this.activate();
			}
			activate() {
				if (this.active || this.disposed) return;
				switchToChatTab();
				const scrollport = findScrollport();
				const flowList = findFlowList();
				if (scrollport === null || flowList === null) {
					showToast("当前会话还没有可分享的对话内容");
					return;
				}
				this.showActionButtons();
				this.active = true;
				this.setShareActive(true);
				this.overlay = new MarkerOverlay({
					onDetach: () => this.deactivate(),
					isStreaming: () => this.sessionRunning()
				});
				this.overlay.activate(scrollport, flowList);
				if (this.sessionRunning()) showToast("对话仍在生成中，标记位置可能随新消息变化");
			}
			deactivate() {
				if (this.disposed) return;
				this.overlay?.dispose();
				this.overlay = null;
				this.hideActionButtons();
				this.active = false;
				this.setShareActive(false);
			}
			/** Highlight the share icon while share mode is active so it reads as a toggle. */
			setShareActive(active) {
				const share = this.shareButton;
				if (share === null) return;
				if (active) {
					share.style.cssText = headerShareButtonStyle() + headerShareButtonActiveStyle();
					share.setAttribute("aria-pressed", "true");
				} else {
					share.style.cssText = headerShareButtonStyle();
					if (this.logBorder !== "") share.style.border = this.logBorder;
					share.removeAttribute("aria-pressed");
				}
			}
			sessionRunning() {
				try {
					const list = this.ctx.sessions.list.getSnapshot();
					const id = list.current;
					if (id === void 0) return false;
					return list.byId[id]?.running ?? false;
				} catch {
					return false;
				}
			}
			/** Human-facing title of the current session, for the download filename. */
			currentTitle() {
				try {
					const list = this.ctx.sessions.list.getSnapshot();
					const id = list.current;
					if (id === void 0) return "";
					const summary = list.byId[id];
					return summary?.displayTitle ?? summary?.title ?? "";
				} catch {
					return "";
				}
			}
			showActionButtons() {
				const row = this.actionsRow;
				const share = this.shareButton;
				if (row === null || share === null || this.cancelButton !== null) return;
				const cancel = document.createElement("button");
				cancel.type = "button";
				cancel.textContent = "取消";
				cancel.style.cssText = ghostButtonStyle();
				if (this.logBorder !== "") cancel.style.border = this.logBorder;
				cancel.addEventListener("click", () => this.deactivate());
				const confirm = document.createElement("button");
				confirm.type = "button";
				confirm.textContent = "确认";
				confirm.style.cssText = primaryButtonStyle();
				confirm.addEventListener("click", () => {
					const range = this.overlay?.currentRange();
					if (range !== null && range !== void 0) this.confirm(range.startEl, range.endEl, range.startEdge, range.endEdge);
				});
				row.insertBefore(cancel, share);
				row.insertBefore(confirm, share);
				this.cancelButton = cancel;
				this.confirmButton = confirm;
			}
			hideActionButtons() {
				this.cancelButton?.remove();
				this.confirmButton?.remove();
				this.cancelButton = null;
				this.confirmButton = null;
			}
			async confirm(startEl, endEl, startEdge, endEdge) {
				const scrollport = findScrollport();
				const flowList = findFlowList();
				if (scrollport === null || flowList === null) {
					showToast("对话流已变化，请重新选择范围");
					this.deactivate();
					return;
				}
				this.deactivate();
				showToast("正在生成截图…", 0);
				try {
					const output = await captureRange({
						scrollport,
						flowList,
						startEl,
						endEl,
						startEdge,
						endEdge,
						brandSvg: findBrandSvg(),
						themeBg: resolveThemeBackground()
					});
					dismissToast();
					this.modal.show(output, this.currentTitle());
				} catch (error) {
					showToast(`截图生成失败：${error instanceof Error ? error.message : String(error)}`);
				}
			}
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["sessions"];
		window.__dshShareDebug = { captureRange };
		/** Mount the browser-side share feature. */
		function apply(ctx) {
			const controller = new ShareController(ctx);
			controller.attach();
			ctx.effect(() => () => controller.dispose(), "conversation-share: browser feature lifecycle");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map