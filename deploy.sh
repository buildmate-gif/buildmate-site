#!/bin/bash

# BuildMate 自動デプロイスクリプト
# 使い方: sh deploy.sh "コミットメッセージ"

MESSAGE=$1
if [ -z "$MESSAGE" ]; then
  MESSAGE="Site update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "🚀 アップロードを開始します..."

# 1. 変更をすべて追加
git add -A

# 2. コミットを作成
git commit -m "$MESSAGE"

# 3. GitHubへ送信
git push origin main

echo "✅ 完了しました！数分でサイトに反映されます。"
