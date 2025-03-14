<div class="content-tools">
  <el-button-group>
    <el-button @click="showStudyAssistant = true">
      <el-icon><Magic /></el-icon>
      学习助手
    </el-button>
  </el-button-group>
</div>

<el-drawer
  v-model="showStudyAssistant"
  title="智能学习助手"
  direction="rtl"
  size="50%"
>
  <StudyAssistant 
    :node-content="selectedNode?.content"
    @update:content="updateNodeContent"
  />
</el-drawer> 