<script>
  export let width = 300;
  export let height = width;
  export let index = 0;

  let image = "";

  import { onMount } from "svelte";

  onMount(() => {
    console.log("the component has mounted", width, height);
  });
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

<div>
  <img
    class="image"
    src={`https://picsum.photos/${width}/${height}?random=${index}`}
    alt="" />
</div>
