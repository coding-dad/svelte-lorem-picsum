<script>
  import ImageView from "./components/ImageView.svelte";
  import { onMount } from "svelte";

  export let page = 1;
  export let limit = 6;

  let overlayVisible = false;
  let imageList = [];
  let overlayImageUrl = "";

  onMount(() => {
    loadImageList();
  });

  const loadImageList = async () => {
    const req = await fetch(
      `https://picsum.photos/v2/list?page=${page}&limit=${limit}`
    );

    const json = await req.json();
    imageList = json;
  };

  const onClickNext = async () => {
    page++;
    loadImageList();
  };

  const onClickBack = async () => {
    if (page === 1) return;

    page--;
    loadImageList();
  };

  const onImageClicked = event => {
    overlayImageUrl = event.detail.imageSource;
    overlayVisible = true;
  };

  $: overlayStyle = overlayVisible
    ? `background-image: url("${overlayImageUrl}");`
    : "";
</script>

<style>
  h1 {
    color: rgb(32, 32, 32);
  }

  .overlay {
    width: 80%;
    height: 80%;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #a1a1a1;

    border-radius: 0.25rem;
    padding: 1rem;

    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;

    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;

    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .overlay::before {
    content: "\00d7";
    display: block;
    width: 100%;
    text-align: right;
  }

  .images {
    display: flex;
    flex-wrap: wrap;
    justify-items: center;
  }

  .container {
    display: flex;
    flex-direction: column;
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

  .buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .buttons button,
  div {
    font-size: 1.2rem;
  }
</style>

<div class="content">
  <div class="header">
    <h1>Svelte Example Lorem Picsum</h1>
  </div>

  <div class="container">
    <div class="images">
      {#each imageList as imageItem}
        <ImageView
          on:showImage={onImageClicked}
          width="300"
          height="200"
          imageId={imageItem.id}
          alt={imageItem.author}
          src={imageItem.download_url} />
      {/each}
    </div>
    <div class="buttons">
      {#if page > 1}
        <button on:click={onClickBack}>&lsaquo;&lsaquo; {page - 1}</button>
      {:else}
        <div />
      {/if}
      <div>{page}</div>
      <button on:click={onClickNext}>{page + 1} &rsaquo;&rsaquo;</button>
    </div>
  </div>

  {#if overlayVisible}
    <div
      class="overlay"
      style={overlayStyle}
      on:click={evt => (overlayVisible = false)} />
  {/if}
</div>
