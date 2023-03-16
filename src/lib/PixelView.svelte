<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { onMount } from 'svelte';

	import { getCoord, autoResize } from '$lib/helpers';

	const dispatch = createEventDispatcher();

	export let pixels: string[][];
	export let asImage = false;
	export let gridShown = false;

	$: rows = pixels.length;
	$: cols = pixels[0].length;

	let image: HTMLImageElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let curX: number;
	let curY: number;

	let renderedImage = false;
	let mounted = false;
	let isPixelSelected = false;
	let selectionTimeout: number | void;

	onMount(async () => {
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		autoResize(canvas, () => (pixels = pixels));
		mounted = true;
		asImage ? await switchMode(true) : 0;
	});

	const switchMode = async (asImage: boolean) => {
		if (!mounted) return;
		mounted = false;
		renderedImage = false;
		await tick();
		if (asImage) {
			draw();
			image.src = canvas.toDataURL();
      dispatch('save', image.src);
			renderedImage = true;
		} else {
			ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
			autoResize(canvas, () => (pixels = pixels));
		}
		mounted = true;
	};

	$: switchMode(asImage);

	$: (isPixelSelected, pixels, gridShown, curX, curY, mounted && !asImage) && draw();

	const draw = () => {
		const [w, h] = [canvas.width, canvas.height];
		const [pW, pH] = [w / cols, h / rows];
		ctx.clearRect(0, 0, w, h);
		ctx.strokeStyle = '#777777';
		pixels.forEach((line, y) =>
			line.forEach((color, x) => {
				ctx.fillStyle = color;
				ctx.fillRect(x * pW, y * pH, pW + 1, pH + 1);
				if (gridShown) {
					ctx.lineWidth = curX === x && curY === y && isPixelSelected ? 7 : 1;
					ctx.strokeRect(x * pW, y * pH, pW, pH);
				}
			})
		);
	};

	const dispatchPixel = (e: MouseEvent | TouchEvent, event: string) => {
		const { x, y } = getCoord(e, cols, rows);
		dispatch(event, { x, y, color: pixels[y][x] });
	};
</script>

{#if asImage}
	<img alt="Pixel View" bind:this={image} class={$$props.class} style={$$props.style} />
{/if}

{#if !renderedImage}
	<canvas
		bind:this={canvas}
		style={$$props.style}
		class={$$props.class}
		on:click={(e) => dispatchPixel(e, 'click')}
		on:mousedown={(e) => dispatchPixel(e, 'mousedown')}
		on:mouseup={(e) => dispatchPixel(e, 'mouseup')}
		on:mouseover={(e) => dispatchPixel(e, 'mouseover')}
		on:mousemove={(e) => {
			dispatchPixel(e, 'mousemove');
			({ x: curX, y: curY } = getCoord(e, cols, rows));
		}}
		on:touchmove|preventDefault={(e) => {
			dispatchPixel(e, 'touchmove');
			isPixelSelected = true;
			if (selectionTimeout) {
				selectionTimeout = clearTimeout(selectionTimeout);
			}
			selectionTimeout = window.setTimeout(() => (isPixelSelected = false), 200);
			({ x: curX, y: curY } = getCoord(e, cols, rows));
		}}
		on:mouseout={() => (isPixelSelected = false)}
		on:focus
		on:blur
	/>
{/if}
