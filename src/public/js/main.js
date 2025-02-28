document.addEventListener('DOMContentLoaded', () => {
  loadStreams();
  
  document.getElementById('addStreamBtn').addEventListener('click', addStream);
});

async function loadStreams() {
  try {
    const response = await fetch('/api/streams');
    const streams = await response.json();
    const streamList = document.getElementById('streamList');
    streamList.innerHTML = '';
    
    streams.forEach(stream => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${stream.name}</td>
        <td>${stream.inputUrl}</td>
        <td>${stream.outputKey}</td>
        <td><span class="badge bg-${getStatusBadgeColor(stream.status)}">${stream.status}</span></td>
        <td>
          ${stream.status === 'running' 
            ? `<button class="btn btn-warning btn-sm" onclick="stopStream('${stream._id}')">停止</button>`
            : `<button class="btn btn-success btn-sm" onclick="startStream('${stream._id}')">启动</button>`
          }
          <button class="btn btn-danger btn-sm" onclick="deleteStream('${stream._id}')">删除</button>
        </td>
      `;
      streamList.appendChild(row);
    });
  } catch (err) {
    console.error('加载流列表失败:', err);
    alert('加载流列表失败');
  }
}

function getStatusBadgeColor(status) {
  switch (status) {
    case 'running': return 'success';
    case 'stopped': return 'secondary';
    case 'error': return 'danger';
    default: return 'primary';
  }
}

async function addStream() {
  const form = document.getElementById('addStreamForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/api/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('添加流失败');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStreamModal'));
    modal.hide();
    form.reset();
    loadStreams();
  } catch (err) {
    console.error('添加流失败:', err);
    alert('添加流失败');
  }
}

async function startStream(id) {
  try {
    const response = await fetch(`/api/streams/${id}/start`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('启动流失败');
    loadStreams();
  } catch (err) {
    console.error('启动流失败:', err);
    alert('启动流失败');
  }
}

async function stopStream(id) {
  try {
    const response = await fetch(`/api/streams/${id}/stop`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('停止流失败');
    loadStreams();
  } catch (err) {
    console.error('停止流失败:', err);
    alert('停止流失败');
  }
}

async function deleteStream(id) {
  if (!confirm('确定要删除这个流吗？')) return;
  
  try {
    const response = await fetch(`/api/streams/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除流失败');
    loadStreams();
  } catch (err) {
    console.error('删除流失败:', err);
    alert('删除流失败');
  }
} 