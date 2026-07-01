let allMetadata = [];     // index.json 的資料
let currentResults = [];

// Debounce
let timeout;
function debouncedSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyFilters();
  }, 180);
}

async function loadIndex() {
  updateStatus("正在載入索引...", 10);
  
  try {
    const res = await fetch('index.json');
    allMetadata = await res.json();
    updateStatus("索引載入完成", 100);
    console.log(`✅ 載入 ${allMetadata.length} 筆 CVE metadata`);
    applyFilters();
  } catch(e) {
    updateStatus("❌ 載入 index.json 失敗", 0);
    console.error(e);
  }
}

function updateStatus(text, percent) {
  document.getElementById("status-text").textContent = text;
  document.getElementById("status-bar").style.width = percent + "%";
}

function applyFilters() {
  const keyword = document.getElementById("keyword").value.toLowerCase().trim();
  
  updateStatus("正在搜尋...", 30);

  const filtered = allMetadata.filter(item => {
    if (!keyword) return true;
    const text = `${item.cve_id} ${item.title} ${(item.tags || []).join(" ")}`.toLowerCase();
    return text.includes(keyword);
  });

  currentResults = filtered;
  document.getElementById("result-count").textContent = filtered.length;
  
  renderResults(filtered);
  updateStatus(`搜尋完成，共 ${filtered.length} 筆`, 100);
}

function renderResults(items) {
  const container = document.getElementById("results-grid");
  container.innerHTML = items.map(item => `
    <div class="cve-card" onclick="loadDetail('${item.cve_id}')">
      <div style="font-weight:bold;color:#2563eb;">${item.cve_id}</div>
      <p style="margin:8px 0;">${item.title}</p>
      <span class="severity ${item.severity}">${item.severity} ${item.score}</span>
      <div style="margin-top:10px;">
        ${(item.domains || []).map(d => `<span class="tag">${d}</span>`).join('')}
      </div>
    </div>
  `).join('') || '<p style="grid-column:1/-1;text-align:center;padding:60px;color:#64748b;">沒有符合的結果</p>';
}

// 點擊後才載入完整 JSON
async function loadDetail(cveId) {
  updateStatus(`正在載入 ${cveId} 詳細資料...`, 50);
  try {
    const res = await fetch(`CVE-json/${cveId}.pavt.json`);
    const fullData = await res.json();
    alert(JSON.stringify(fullData, null, 2).slice(0, 800) + "\n\n...（已載入完整資料）");
    // 這裡可以改成顯示 Modal
    updateStatus("載入完成", 100);
  } catch(e) {
    alert("載入詳細資料失敗");
    updateStatus("載入失敗", 0);
  }
}

function exportJSON() {
  const dataStr = JSON.stringify(currentResults, null, 2);
  downloadFile(dataStr, `pavt_results_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
}

function exportCSV() {
  let csv = "CVE ID,Title,Score,Severity,Domains\n";
  currentResults.forEach(item => {
    csv += `"${item.cve_id}","${item.title.replace(/"/g,'""')}","${item.score}","${item.severity}","${(item.domains||[]).join('; ')}"\n`;
  });
  downloadFile(csv, `pavt_results_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// 初始化
window.onload = loadIndex;