<template>
  <div class="goals-view">
    <GoalManager />
  </div>
</template>

<script setup>
import GoalManager from '../components/GoalManager.vue'
</script>

<style scoped>
.goals-view {
  height: calc(100vh - 60px);
  padding: 20px;
}
</style> 