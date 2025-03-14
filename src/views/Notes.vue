<template>
  <div class="notes-view">
    <StudyNotes />
  </div>
</template>

<script setup>
import StudyNotes from '../components/StudyNotes.vue'
</script>

<style scoped>
.notes-view {
  height: calc(100vh - 60px);
}
</style> 