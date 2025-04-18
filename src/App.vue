<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "App",
  components: {},
};
</script>

<style>
  .main-box {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px;
    font-family: 'Arial', sans-serif;
  }
  h2 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 2px solid #eee;
    padding-bottom: 15px;
  }
</style>
