<img width="220" height="136" alt="image" src="https://github.com/user-attachments/assets/1a04f93d-041d-493a-8d04-d5693798773b" /># HotStuff

HotStuff là một nền tảng web hiện đại giúp người dùng dễ dàng tìm kiếm cảm hứng ẩm thực, lưu trữ sổ tay nấu ăn kỹ thuật số cá nhân và học hỏi qua các video hướng dẫn trực quan.

## 🚀 Tính năng nổi bật
* **Khám phá ẩm thực phong phú:** Tích hợp dữ liệu từ TheMealDB API với hàng ngàn công thức theo danh mục[cite: 6].
* **Quản lý công thức cá nhân (CRUD):** Thêm, sửa, xóa và lưu trữ công thức riêng tư trực tiếp lên đám mây[cite: 6].
* **Xác thực bảo mật:** Đăng nhập và đăng ký tài khoản an toàn thông qua Firebase Auth[cite: 5, 8].
* **Tải lên hình ảnh đám mây:** Tích hợp Cloudinary Upload Widget cho hình ảnh món ăn và avatar cá nhân[cite: 1, 6, 7].
* **Giao diện Glassmorphism hiện đại:** Hỗ trợ chuyển đổi chế độ Sáng/Tối (Light/Dark Mode) mượt mà[cite: 7, 9].

## 🛠️ Công nghệ sử dụng
* **Frontend:** HTML5, CSS3 (Custom Properties, Flexbox/Grid), Vanilla JavaScript (ES Modules)[cite: 1, 2, 3, 4, 5, 6, 7, 8, 9].
* **Backend & Database:** Firebase Authentication & Cloud Firestore[cite: 5, 8].
* **Cloud Storage & Media:** Cloudinary API[cite: 1, 6, 7].
* **External API:** TheMealDB API[cite: 6].

## 📂 Cấu trúc dự án
* `index.html`: Trang ứng dụng chính (Khám phá, Bộ sưu tập, Video, Tài khoản)[cite: 1].
* `page/welcome.html`: Trang giới thiệu dự án[cite: 3].
* `page/login.html` & `page/register.html`: Các trang xác thực tài khoản[cite: 2, 4].
* `js/script.js`: Xử lý logic chính, gọi API và kết nối Firestore[cite: 6].
* `js/auth.js`: Quản lý trạng thái đăng nhập và phân quyền[cite: 8].
* `js/ui.js`: Điều hướng giao diện, Modal và chuyển đổi giao diện sáng/tối[cite: 7].
* `css/style.css`: Bảng định kiểu toàn cục theo phong cách Glassmorphism[cite: 9].
