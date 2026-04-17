/**
 * 获取 noise SVG 字符串
 */
export function noiseBackground() {
	return `<svg width="1901" height="961" viewBox="0 0 1901 961" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g opacity="0.25" filter="url(#filter0_n_1_2)">
	<rect width="1901" height="961" fill="#EFEFEF"/>
	</g>
	<defs>
	<filter id="filter0_n_1_2" x="0" y="0" width="1901" height="961" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
	<feFlood flood-opacity="0" result="BackgroundImageFix"/>
	<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
	<feTurbulence type="fractalNoise" baseFrequency="1.25 1.25" stitchTiles="stitch" numOctaves="3" result="noise" seed="5339" />
	<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
	<feComponentTransfer in="alphaNoise" result="coloredNoise1">
	<feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
		</feComponentTransfer>
		<feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
	<feFlood flood-color="rgba(0, 0, 0, 0.25)" result="color1Flood" />
	<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
	<feMerge result="effect1_noise_1_2">
	<feMergeNode in="shape" />
	<feMergeNode in="color1" />
		</feMerge>
		</filter>
		</defs>
		</svg>`;
}

/**
 * 将 noise 效果插入到指定的 HTML 元素中
 * @param container - 目标容器元素
 * @param options - 配置选项
 */
export function insertNoise(
	container: HTMLElement,
	options?: {
		opacity?: number; // 透明度，默认 0.25
		position?: 'absolute' | 'relative'; // 定位方式，默认 'absolute'
		zIndex?: number; // z-index 值，默认 1
	}
) {
	const {
		opacity = 0.25,
		position = 'absolute',
		zIndex = 1
	} = options || {};

	// 创建 noise 容器
	const noiseLayer = container.createDiv('tg-noise-layer-inline');

	// 设置样式
	noiseLayer.style.position = position;
	noiseLayer.style.top = '0';
	noiseLayer.style.left = '0';
	noiseLayer.style.width = '100%';
	noiseLayer.style.height = '100%';
	noiseLayer.style.pointerEvents = 'none';
	noiseLayer.style.opacity = opacity.toString();
	noiseLayer.style.zIndex = zIndex.toString();

	// 插入 SVG
	noiseLayer.innerHTML = noiseBackground();

	// 将 noise 层插入到容器的第一个位置
	container.insertBefore(noiseLayer, container.firstChild);

	// 返回 noise 元素，方便后续移除
	return noiseLayer;
}

/**
 * 移除通过 insertNoise 添加的 noise 效果
 * @param container - 容器元素
 */
export function removeNoise(container: HTMLElement) {
	const noiseLayer = container.querySelector('.tg-noise-layer-inline');
	if (noiseLayer) {
		noiseLayer.remove();
	}
}
