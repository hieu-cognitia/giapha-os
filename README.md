# Gia Phả OS (Gia Phả Open Source)

Đây là mã nguồn mở cho ứng dụng quản lý gia phả dòng họ, cung cấp giao diện trực quan để xem sơ đồ phả hệ, quản lý thành viên và tìm kiếm danh xưng.

Dự án ra đời từ nhu cầu thực tế: cần một hệ thống Cloud để con cháu ở nhiều nơi có thể cùng cập nhật thông tin (kết hôn, sinh con...), thay vì phụ thuộc vào một máy cục bộ. Việc tự triển khai mã nguồn mở giúp gia đình bạn nắm trọn quyền kiểm soát dữ liệu nhạy cảm, thay vì phó mặc cho các dịch vụ bên thứ ba. Ban đầu mình chỉ làm cho gia đình sử dụng, nhưng vì được nhiều người quan tâm nên mình quyết định chia sẻ công khai.

Phù hợp với người Việt Nam.

> **⚠️ LƯU Ý:** Đây là một fork được cải thiện từ dự án gốc, thay thế Supabase bằng **PocketBase** để đơn giản hóa triển khai cục bộ, tránh phụ thuộc vào dịch vụ bên thứ ba. Vibe-coded, **không có đảm bảo an ninh hoặc hỗ trợ cập nhật** trong tương lai.

## Các tính năng chính

- **Sơ đồ trực quan**: Xem gia phả dạng Cây (Tree) và Sơ đồ tư duy (Mindmap).
- **Tìm danh xưng**: Tự động xác định cách gọi tên (Bác, Chú, Cô, Dì...) chính xác.
- **Quản lý thành viên**: Lưu trữ thông tin, avatar và sắp xếp thứ tự nhánh dòng họ.
- **Thống kê & Sự kiện**: Theo dõi ngày giỗ và các chỉ số nhân khẩu học của dòng họ.
- **Sao lưu dữ liệu**: Xuất/nhập file JSON để lưu trữ hoặc di chuyển dễ dàng.
- **Bảo mật**: Phân quyền Admin và bảo vệ dữ liệu bằng [PocketBase](https://pocketbase.io) tự lưu trữ.
- **Đa thiết bị**: Giao diện hiện đại, tối ưu cho cả máy tính và điện thoại.

## Demo

- Demo: [giapha-os.homielab.com](https://giapha-os.homielab.com)
- Tài khoản: `giaphaos@homielab.com`
- Mật khẩu: `giaphaos`

## Hình ảnh Giao diện

![Danh sách](docs/screenshots/list.png)

![Sơ đồ cây](docs/screenshots/tree.png)

![Mindmap](docs/screenshots/mindmap.png)

![Mindmap](docs/screenshots/stats.png)

![Mindmap](docs/screenshots/kinship.png)

![Mindmap](docs/screenshots/events.png)

## Cài đặt và Chạy dự án

Chỉ cần khoảng 10 -> 15 phút là bạn có thể tự dựng hệ thống gia phả cho gia đình mình.

Dự án sử dụng **[PocketBase](https://pocketbase.io)** — một file thực thi đơn lẻ, không cần cài đặt phức tạp.

---

## Chạy với Docker (Nhanh nhất)

Yêu cầu: [Docker Desktop](https://www.docker.com/products/docker-desktop)

1. Clone hoặc tải project về máy.
2. Chạy:

```bash
docker compose up --build
```

3. Chờ 1-2 phút để containers khởi động.
4. Pocketbase container sẽ in ra một đường dẫn để đăng kí tài khoản **superadmin** lần đầu.
5. Đổi tên file `.env.example` thành `.env.local`.
6. Mở file `.env.local` và điền các giá trị:

```env
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"
POCKETBASE_SUPERADMIN_EMAIL="admin@example.com"
POCKETBASE_SUPERADMIN_PASSWORD="your-superadmin-password"
```
7. Tạo schema và nạp dữ liệu mẫu:

```bash
npm run pb:setup -- --seed
```

Xong! Tạo tài khoản và đăng nhập tại tại `http://localhost:3030` để thử.

---

## 1. Cài đặt và cấu hình PocketBase

1. Tải PocketBase từ https://pocketbase.io/docs/ (chọn phiên bản phù hợp với hệ điều hành).
2. Chạy PocketBase:

```bash
./pocketbase serve
```

3. Pocketbase sẽ tự mở 1 URL để tạo tài khoản **superadmin** lần đầu.

4. Tạo schema tự động bằng lệnh (không cần thao tác trong Admin UI):

```bash
npm run pb:setup
```

Muốn nạp sẵn dữ liệu mẫu (27 thành viên — 4 đời, Dòng họ Vạn hư cấu) để thử nghiệm:

```bash
npm run pb:setup -- --seed
```

Hoặc nếu collections đã tồn tại, chỉ nạp dữ liệu:

```bash
npm run pb:seed
```

---

## Cách 1: Deploy lên Vercel (kết hợp PocketBase self-hosted)

1. Tạo tài khoản miễn phí tại https://vercel.com nếu chưa có.
2. Fork hoặc clone repository này.
3. Nhấn **Deploy** trên Vercel, điền các biến môi trường:
   - `NEXT_PUBLIC_POCKETBASE_URL` = URL công khai của PocketBase server
   - `POCKETBASE_SUPERADMIN_EMAIL` = Email superadmin PocketBase
   - `POCKETBASE_SUPERADMIN_PASSWORD` = Mật khẩu superadmin PocketBase
4. Nhấn **Deploy** và chờ 2 -> 3 phút.

---

## Cách 2: Chạy trên máy cá nhân

Yêu cầu: máy đã cài [Node.js](https://nodejs.org/en) và [Bun](https://bun.sh/)

1. Clone hoặc tải project về máy.
2. Đổi tên file `.env.example` thành `.env.local`.
3. Mở file `.env.local` và điền các giá trị:

```env
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"
POCKETBASE_SUPERADMIN_EMAIL="admin@example.com"
POCKETBASE_SUPERADMIN_PASSWORD="your-superadmin-password"
```

4. Cài thư viện

```bash
bun install
```

5. Chạy dự án

```bash
bun run dev
```

Mở trình duyệt và truy cập: `http://localhost:3030`

---

## Tài khoản đầu tiên

- Đăng ký tài khoản mới khi vào web lần đầu.
- Người đăng ký đầu tiên sẽ tự động có quyền **admin**.
- Các tài khoản đăng ký sau sẽ mặc định là **member** và cần admin kích hoạt.

## Đóng góp (Contributing)

Dự án này là mã nguồn mở, hoan nghênh mọi đóng góp, báo cáo lỗi (issues) và yêu cầu sửa đổi (pull requests) để phát triển ứng dụng ngày càng tốt hơn.

## Tuyên bố từ chối trách nhiệm & Quyền riêng tư

> **Dự án này chỉ cung cấp mã nguồn (source code). Không có bất kỳ dữ liệu cá nhân nào được thu thập hay lưu trữ bởi tác giả.**

- **Tự lưu trữ hoàn toàn (Self-hosted):** Khi bạn triển khai ứng dụng, toàn bộ dữ liệu gia phả (tên, ngày sinh, quan hệ, thông tin liên hệ...) được lưu trữ **trong PocketBase server của chính bạn**. Tác giả dự án không có quyền truy cập vào database đó.

- **Không thu thập dữ liệu:** Không có analytics, không có tracking, không có telemetry, không có bất kỳ hình thức thu thập thông tin người dùng nào được tích hợp trong mã nguồn.

- **Bạn kiểm soát dữ liệu của bạn:** Mọi dữ liệu gia đình, thông tin thành viên đều nằm hoàn toàn trong PocketBase mà bạn cài đặt và quản lý. Bạn có thể xóa, xuất hoặc di chuyển dữ liệu bất cứ lúc nào.

- **Demo công khai:** Trang demo tại `giapha-os.homielab.com` sử dụng dữ liệu mẫu hư cấu, không chứa thông tin của người thật. Không nên nhập thông tin cá nhân thật vào trang demo.

## Giấy phép (License)

Dự án được phân phối dưới giấy phép MIT.
