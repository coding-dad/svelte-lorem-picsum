<script>
  import { createEventDispatcher } from "svelte";

  export let width = 300;
  export let height = width;
  export let imageId = 0;
  export let alt = "an image";
  export let src = "";

  const dispatch = createEventDispatcher();
  let image = "";
</script>

<style>
  .image {
    border-radius: 1rem;
    padding: 0.6rem;
    margin: 0.6rem;

    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
</style>

<div on:click={() => dispatch('showImage', { imageSource: src })}>
  <img
    class="image"
    src={`https://picsum.photos/id/${imageId}/${width}/${height}`}
    {alt} />
</div>
