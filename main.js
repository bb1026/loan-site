const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const downloadLink = document.getElementById('downloadLink');

uploadBtn.addEventListener('click', upload);

async function upload() {
  const file = fileInput.files[0];
  if (!file) {
    alert('请选择要上传的文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  downloadLink.textContent = '正在上传，请稍候...';

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.downloadUrl) {
      const fullUrl = `${location.origin}${data.downloadUrl}`;
      downloadLink.innerHTML = `
        <a href="${data.downloadUrl}" target="_blank">点击这里下载文件</a><br>${fullUrl}
      `;
    } else {
      downloadLink.textContent = data.error || '上传失败';
    }
  } catch (e) {
    downloadLink.textContent = '上传失败，请检查网络';
  }
}