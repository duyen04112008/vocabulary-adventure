# WordNest — học từ vựng, vui mỗi ngày

Website học từ vựng tiếng Anh có thể chạy ngay bằng HTML, CSS và JavaScript thuần, không cần cài đặt hay build.

## Bắt đầu sử dụng

Mở [index.html](index.html) trong trình duyệt, hoặc bật GitHub Pages trong **Settings → Pages** để xuất bản thành website công khai.

## Tính năng hiện có

- Ba bộ từ: TOEIC (đủ 100 cụm từ trong danh sách đã cung cấp), IELTS thông dụng (bộ từ khởi đầu), và tiếng Anh cơ bản.
- Flashcard lật thẻ, đánh dấu đã thuộc/gần nhớ/ôn lại.
- Quiz trắc nghiệm có chấm đáp án, giải thích khi chọn sai và cộng XP.
- Phát âm bằng Web Speech API; chọn giọng Anh-Mỹ hoặc Anh-Anh tùy trình duyệt.
- Tìm từ theo thời gian thực, lọc A–Z, phân trang 50 từ mỗi trang và bộ lọc từ cần ôn.
- Lưu tiến độ, từ yêu thích, XP, streak và giao diện sáng/tối trong localStorage.
- Responsive cho điện thoại, tablet và máy tính; thao tác bàn phím cơ bản.

## Dữ liệu

Từ vựng nằm trong `vocabulary.js`. Mỗi bộ là một mảng riêng (`toeic`, `ielts`, `basic`); thêm từ theo cấu trúc `{ word, meaning, type, ipa }` hoặc dạng tuple tương ứng trong dữ liệu hiện có. Dữ liệu IELTS hiện là bộ khởi đầu được tuyển chọn, chưa phải toàn bộ danh sách A–C dài đã gửi trong hội thoại.

Tiến độ được lưu trong trình duyệt hiện tại. Form tài khoản/backend chưa được tích hợp nên dữ liệu không đồng bộ giữa thiết bị.
