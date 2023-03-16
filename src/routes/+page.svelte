<script lang="ts">
  import PixelView from "$lib/PixelView.svelte";
  import {pixelsFromUrl, fitSquare} from "$lib/helpers";
  import { onMount } from "svelte";
  let pixels: string[][];
  onMount(async () => {
    const w = 16;
    pixels = await pixelsFromUrl("/anime.jpg", w)
    pixels = fitSquare(pixels);
    console.log(pixels.length)
    console.log(pixels[0].length)
  })
</script>

{#if pixels}
<PixelView pixels={pixels}
    on:click={e => alert(JSON.stringify(e.detail))} 
    on:save={e => alert(e.detail)}
    asImage={false}
    style="border-radius: 10px; height: 700px; width: 700px;"
  />
{/if}
