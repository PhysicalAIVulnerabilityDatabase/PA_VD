let allMetadata = [];

// ==================== 重點修正 ====================
async function loadIndex() {
  updateStatus("正在載入索引...", 10);
  
  // 多種可能路徑嘗試（解決 GitHub Pages 常見問題）
  const possiblePaths = [
    './index.json',           // 根目錄
    'index.json',
    '/index.json',
    '../index.json'           // 如果放在子資料夾
  ];

  for (const path of possiblePaths) {
    try {
      console.log(`嘗試載入: ${path}`);
      const res = await fetch(path, { cache: 'no-store' });
      
      if (res.ok) {
        allMetadata = await res.json();
        console.log(`✅ 成功載入 ${allMetadata.length} 筆資料`);
        updateStatus(`索引載入完成 (${allMetadata.length} 筆)`, 100);
        applyFilters();
        return;
      }
    } catch (e) {
      console.log(`嘗試 ${path} 失敗`);
    }
  }

  // 如果都失敗，顯示詳細錯誤
  updateStatus("❌ 載入 index.json 失敗", 0);
  console.error("請確認以下事項：");
  console.error("1. index.json 是否真的在網站根目錄？");
  console.error("2. GitHub Pages 是否已正確部署？");
  console.error("3. 檔案名稱是否完全正確（大小寫）？");
}

// 其餘函數保持不變...
function updateStatus(text, percent) {
  document.getElementById("status-text").textContent = text;
  document.getElementById("status-bar").style.width = percent + "%";
}

function applyFilters() {
  const keyword = document.getElementById("keyword").value.toLowerCase().trim();
  updateStatus("正在搜尋...", 40);

  const filtered = allMetadata.filter(item => {
    if (!keyword) return true;
    const text = `${item.cve_id || ''} ${item.title || ''} ${(item.tags || []).join(" ")}`.toLowerCase();
    return text.includes(keyword);
  });

  currentResults = filtered;
  document.getElementById("result-count").textContent = filtered.length;
  renderResults(filtered);
  updateStatus(`搜尋完成，共 ${filtered.length} 筆`, 100);
}

// ... 其他函數 (renderResults, loadDetail, exportJSON 等) 保持原樣
