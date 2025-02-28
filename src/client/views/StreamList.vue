<template>
  <div class="stream-list">
    <el-button type="primary" @click="showAddDialog">添加流</el-button>
    
    <el-table :data="streams">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="inputUrl" label="输入地址" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'running' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button 
            :type="row.status === 'stopped' ? 'primary' : 'danger'"
            @click="toggleStream(row)"
          >
            {{ row.status === 'stopped' ? '启动' : '停止' }}
          </el-button>
          <el-button type="danger" @click="deleteStream(row._id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑流对话框 -->
    <el-dialog v-model="dialogVisible" title="流配置">
      <el-form :model="streamForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="streamForm.name" />
        </el-form-item>
        <el-form-item label="输入地址">
          <el-input v-model="streamForm.inputUrl" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStream">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const streams = ref([]);
const dialogVisible = ref(false);
const streamForm = ref({
  name: '',
  inputUrl: ''
});

// 获取流列表
const fetchStreams = async () => {
  const { data } = await axios.get('/api/streams');
  streams.value = data;
};

// 切换流状态
const toggleStream = async (stream: any) => {
  try {
    await axios.post(`/api/streams/${stream._id}/${stream.status === 'stopped' ? 'start' : 'stop'}`);
    await fetchStreams();
    ElMessage.success('操作成功');
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 保存流配置
const saveStream = async () => {
  try {
    await axios.post('/api/streams', streamForm.value);
    dialogVisible.value = false;
    await fetchStreams();
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

onMounted(fetchStreams);
</script> 