#!/bin/bash
# ============================================================
# Script dọn dẹp repo predict_flu_zone trước khi cho HR xem
# Chạy trong thư mục gốc của repo (nơi có Readme.md, API/, data/)
# ============================================================
set -e

echo "== BƯỚC 1: Xoá __pycache__ và file build rác =="
git rm -r --cached "API/__pycache__" 2>/dev/null || true
rm -rf "API/__pycache__"

echo "== BƯỚC 2: Xoá .vscode (cấu hình máy cá nhân) =="
git rm -r --cached ".vscode" 2>/dev/null || true
rm -rf ".vscode"

echo "== BƯỚC 3: Tạo .gitignore =="
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/

# Editor
.vscode/
.idea/

# Env & secrets
.env

# OS
.DS_Store
Thumbs.db
EOF

echo "== BƯỚC 4: Tạo .env.example (thay cho key hardcode trong main.py) =="
cat > API/.env.example << 'EOF'
WEATHER_API_KEY=your_openweathermap_api_key_here
MONGO_URI=mongodb://localhost:27017
MODELS_DIR=../models
EOF

echo "== BƯỚC 5: XOÁ WEATHER_API_KEY khỏi TOÀN BỘ lịch sử git (quan trọng, key đã bị lộ) =="
echo "   -> Cần cài git-filter-repo: pip install git-filter-repo"
if command -v git-filter-repo >/dev/null 2>&1; then
  git filter-repo --replace-text <(echo '862e70d3da664d7d00121f16524c1e66==>REDACTED_API_KEY') --force
  echo "   Đã thay key cũ bằng REDACTED_API_KEY trong toàn bộ lịch sử."
  echo "   NHỚ: vẫn phải revoke key cũ trên OpenWeatherMap."
else
  echo "   !! Chưa có git-filter-repo. Cài bằng: pip install git-filter-repo"
  echo "   Sau đó chạy lại lệnh filter-repo ở trên."
fi

echo ""
echo "Xong bước dọn local. Kiểm tra lại bằng: git status"
echo "File API/main.py đã được sửa để đọc WEATHER_API_KEY, MONGO_URI, MODELS_DIR từ .env"
echo "Nhớ tạo API/.env (copy từ .env.example) với key MỚI trước khi chạy lại app."
echo "Sau khi hài lòng: git add -A && git commit -m 'chore: clean up repo, move secrets to env vars'"
echo "Vì đã rewrite history (bước 5), khi push cần: git push --force origin main"