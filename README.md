# Natours

## Mô tả
Natours là một ứng dụng web du lịch, nơi người dùng có thể tìm kiếm, đặt tour du lịch và quản lý thông tin cá nhân. Dự án được xây dựng bằng Node.js, Express.js và MongoDB, với giao diện người dùng được thiết kế hiện đại và thân thiện.

## Các tính năng chính
- Đăng ký và đăng nhập người dùng.
- Tìm kiếm và xem chi tiết các tour du lịch.
- Đặt tour và quản lý các đặt chỗ.
- Quản lý thông tin cá nhân.
- Hệ thống quản trị để quản lý tour, người dùng và đánh giá.

## Cài đặt

### Yêu cầu hệ thống
- Node.js (phiên bản >= 14.x)
- MongoDB

### Hướng dẫn cài đặt
1. Clone repository:
   ```bash
   git clone <repository-url>
   cd natours
   ```
2. Cài đặt các dependencies:
   ```bash
   npm install
   ```
3. Cấu hình môi trường:
   - Tạo file `.env` trong thư mục gốc và thêm các biến môi trường cần thiết (tham khảo file `.env.example` nếu có).
4. Chạy ứng dụng:
   ```bash
   npm run start
   ```

### Sử dụng các script trong package.json

Dự án cung cấp một số script hữu ích để hỗ trợ phát triển và triển khai ứng dụng. Dưới đây là hướng dẫn sử dụng:

- **Khởi động ứng dụng ở chế độ Development**:
  ```bash
  npm run start
  ```
  Ứng dụng sẽ chạy với `NODE_ENV=dev` và sử dụng `nodemon` để tự động tải lại khi có thay đổi.

- **Khởi động ứng dụng ở chế độ Production**:
  ```bash
  npm run start:prod
  ```
  Ứng dụng sẽ chạy với `NODE_ENV=prod`.

- **Chạy chế độ Debug**:
  ```bash
  npm run debug
  ```
  Sử dụng `ndb` để gỡ lỗi ứng dụng.

- **Theo dõi và biên dịch JavaScript**:
  ```bash
  npm run watch:js
  ```
  Sử dụng `parcel` để theo dõi và biên dịch file JavaScript.

- **Biên dịch JavaScript**:
  ```bash
  npm run build:js
  ```
  Biên dịch file JavaScript một lần.

- **Chạy kiểm thử**:
  ```bash
  npm run test
  ```
  Chạy toàn bộ các bài kiểm thử với `jest`.

- **Theo dõi kiểm thử**:
  ```bash
  npm run test:watch
  ```
  Chạy kiểm thử và theo dõi thay đổi.

- **Kiểm tra độ bao phủ kiểm thử**:
  ```bash
  npm run test:coverage
  ```
  Tạo báo cáo độ bao phủ kiểm thử.

## Cấu trúc thư mục
- `src/`: Chứa mã nguồn chính của ứng dụng.
  - `controllers/`: Các controller xử lý logic ứng dụng.
  - `models/`: Các mô hình dữ liệu sử dụng Mongoose.
  - `routes/`: Định nghĩa các route của ứng dụng.
  - `views/`: Các template giao diện người dùng.
- `public/`: Chứa các file tĩnh như CSS, JavaScript, hình ảnh.
- `dev-data/`: Dữ liệu mẫu để phát triển và kiểm thử.
- `test/`: Chứa các bài kiểm thử.

## Đóng góp
Nếu bạn muốn đóng góp cho dự án, vui lòng tạo một pull request hoặc mở issue để thảo luận.

## Giấy phép
Dự án này được cấp phép theo giấy phép MIT.
