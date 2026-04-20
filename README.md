# PTT Media Preview Plus 🚀 (AI 協作版)

本專案是一個 Chrome 擴充功能，旨在增強 PTT (term.ptt.cc 與 www.ptt.cc) 的連結預覽體驗。

---

### 🌟 聲明
本專案 fork 自 [mingc00/ptt-media-preview](https://github.com/mingc00/ptt-media-preview)，並在原有基礎上由 **AI 協作進行大幅度重構與功能增強**。

---

### ✨ Plus 版新增功能

1.  **規則系統重構**：將預覽邏輯模組化，大幅提升擴充性，可輕鬆增加新的圖片來源。
2.  **擴展圖片支援**：
    *   **mopix.cc**：自動將 `i.mopix.cc` 網址轉換為 `i-mopix-cc.translate.goog` 以繞過阻擋並正確預覽。
    *   **meee.com.tw**：優化 Meee 圖床預覽。
    *   **Twitter/X 媒體**：支援 Twitter 圖片預覽。
3.  **自定義強化懸浮預覽 (term.ptt.cc)**：
    *   **突破白名單限制**：實現自定義懸浮視窗，支援 PttChrome 原生不支援的網域。
    *   **智慧型定位防遮擋**：預覽圖會自動感應螢幕邊界，若上方或右方空間不足會自動翻轉，並確保頂部不會超出螢幕。
    *   **適度尺寸縮放**：圖片會自動縮放至視窗的 80% 以內，保持視覺舒適度。
    *   **平滑視覺效果**：加入淡入淡出動畫，提升使用質感。
4.  **鍵盤導覽優化**：
    *   針對 PTT 使用習慣，監聽鍵盤按鍵。當使用者按下 `<-`、`Enter` 或導覽鍵離開文章時，預覽圖會立即隱藏，不再殘留在畫面上。

---

## 安裝

### Chromium

1.  下載本專案原始碼並解壓縮。
2.  開啟 Chrome 瀏覽器，進入 `chrome://extensions/`。
3.  開啟右上角的「開發者模式」。
4.  點擊「載入解壓縮擴充功能」，並選擇本專案資料夾。

## [Changelog](CHANGELOG.md)

## 授權
[MIT License](LICENSE)
