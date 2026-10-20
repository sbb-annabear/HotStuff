# HotStuff

HotStuff là một nền tảng web hiện đại giúp người dùng dễ dàng tìm kiếm cảm hứng ẩm thực, lưu trữ sổ tay nấu ăn kỹ thuật số cá nhân và học hỏi qua các video hướng dẫn trực quan.

## Tính năng nổi bật
* **Khám phá ẩm thực phong phú:** Tích hợp dữ liệu từ TheMealDB API với hàng ngàn công thức theo danh mục.
* **Quản lý công thức cá nhân (CRUD):** Thêm, sửa, xóa và lưu trữ công thức riêng tư trực tiếp lên đám mây.
* **Xác thực bảo mật:** Đăng nhập và đăng ký tài khoản an toàn thông qua Firebase Auth.
* **Tải lên hình ảnh đám mây:** Tích hợp Cloudinary Upload Widget cho hình ảnh món ăn và avatar cá nhân.
* **Giao diện Glassmorphism hiện đại:** Hỗ trợ chuyển đổi chế độ Sáng/Tối (Light/Dark Mode) mượt mà.

## Công nghệ sử dụng
* **Frontend:** HTML5, CSS3 (Custom Properties, Flexbox/Grid), Vanilla JavaScript (ES Modules).
* **Backend & Database:** Firebase Authentication & Cloud Firestore.
* **Cloud Storage & Media:** Cloudinary API.
* **External API:** TheMealDB API.

## Cấu trúc dự án
* `index.html`: Trang ứng dụng chính (Khám phá, Bộ sưu tập, Video, Tài khoản).
* `page/welcome.html`: Trang giới thiệu dự án.
* `page/login.html` & `page/register.html`: Các trang xác thực tài khoản.
* `js/script.js`: Xử lý logic chính, gọi API và kết nối Firestore.
* `js/auth.js`: Quản lý trạng thái đăng nhập và phân quyền.
* `js/ui.js`: Điều hướng giao diện, Modal và chuyển đổi giao diện sáng/tối.
* `css/style.css`: Bảng định kiểu toàn cục theo phong cách Glassmorphism.
