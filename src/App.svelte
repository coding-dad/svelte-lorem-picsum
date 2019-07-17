<script>
  import ImageView from "./components/ImageView.svelte";

  const range = (start, end) => {
    return Array(end - start + 1)
      .fill()
      .map((_, idx) => start + idx);
  };
</script>

<style>
  h1 {
    color: rgb(32, 32, 32);
  }

  .images {
    display: flex;
    flex-wrap: wrap;
    justify-items: center;
  }

  .container {
    display: flex;
    width: 80%;
    max-width: 1024px;
    justify-content: center;
    margin-right: auto;
    margin-left: auto;
    margin-bottom: 2rem;
  }

  .header {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
</style>

<div class="header">
  <h1>Svelte Example Lorem Picsum</h1>
</div>

<div class="container">
  <div class="images">
    {#each range(0, 11) as idx}
      <ImageView width="300" height="200" index={idx} />
    {/each}
  </div>
</div>
