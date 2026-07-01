import json
import os
from pathlib import Path
from tqdm import tqdm
import time

def generate_pavt_index(
    json_dir: str = "CVE-json",
    output_file: str = "index.json",
    max_files: int = None
):
    """
    掃描 CVE-json 目錄，生成輕量 index.json
    """
    json_path = Path(json_dir)
    if not json_path.exists():
        print(f"❌ 目錄不存在: {json_path}")
        return

    # 收集所有 .pavt.json 或 .json 檔案
    files = list(json_path.glob("**/*.json"))
    if not files:
        files = list(json_path.glob("**/*.pavt.json"))
    
    print(f"找到 {len(files)} 個 JSON 檔案")

    if max_files:
        files = files[:max_files]
        print(f"限制處理前 {max_files} 個檔案")

    index_data = []
    errors = 0
    start_time = time.time()

    for file_path in tqdm(files, desc="處理 CVE 檔案", unit="file"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 提取核心 metadata
            cvss = data.get('cvss', {})
            taxonomy = data.get('taxonomy', {})

            # 提取 domains
            domains = []
            for domain_item in taxonomy.get('physical_ai_domain', []):
                if isinstance(domain_item, dict) and 'domain' in domain_item:
                    domains.append(domain_item['domain'])
                elif isinstance(domain_item, str):
                    domains.append(domain_item)

            # 提取 vendors
            vendors = []
            for vendor_item in taxonomy.get('vendor', []):
                if isinstance(vendor_item, dict) and 'name' in vendor_item:
                    vendors.append(vendor_item['name'])
                elif isinstance(vendor_item, str):
                    vendors.append(vendor_item)

            entry = {
                "cve_id": data.get("cve_id"),
                "title": data.get("title"),
                "published": data.get("published"),
                "score": cvss.get("score") or cvss.get("score_used"),
                "severity": cvss.get("severity"),
                "domains": domains,
                "vendors": vendors,
                "tags": data.get("cross_domain_tags", []),
                "file_name": file_path.name
            }

            # 移除 None 值
            entry = {k: v for k, v in entry.items() if v is not None}
            index_data.append(entry)

        except Exception as e:
            errors += 1
            print(f"⚠️  處理失敗 {file_path.name}: {e}")
            continue

    # 儲存 index.json
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print("\n" + "="*60)
    print("✅ 完成！")
    print(f"   成功處理: {len(index_data)} 筆")
    print(f"   錯誤: {errors} 筆")
    print(f"   輸出檔案: {output_file} ({os.path.getsize(output_file)/1024/1024:.2f} MB)")
    print(f"   花費時間: {elapsed:.2f} 秒")
    print("="*60)


if __name__ == "__main__":
    # ==================== 可調整參數 ====================
    generate_pavt_index(
        json_dir="CVE-json",      # 你的 JSON 目錄
        output_file="index.json", # 輸出的 index 檔案
        max_files=None            # 設數字可限制筆數（測試用）
    )