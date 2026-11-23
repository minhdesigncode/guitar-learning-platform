# Bật đăng nhập Google + lưu cloud cho Sổ Đàn

Code đã sẵn. Chưa làm các bước dưới thì app vẫn chạy y như cũ (chỉ lưu trên máy, không có nút Đăng nhập). Mất khoảng 15 phút.

## 1. Tạo project Supabase
1. Vào https://supabase.com → đăng nhập (dùng GitHub cho nhanh) → **New project**.
2. Tên: `so-dan`, đặt mật khẩu database (lưu vào trình quản lý mật khẩu, app không cần), Region: **Southeast Asia (Singapore)**. Gói Free.
3. Chờ project tạo xong (~2 phút).

## 2. Tạo bảng + kho bản thu
1. Menu trái **SQL Editor** → **New query**.
2. Dán toàn bộ nội dung file `supabase/schema.sql` trong repo → **Run**. Thấy "Success. No rows returned" là được.

## 3. Lấy 2 giá trị cho app
**Project Settings → API** (hoặc nút **Connect** trên cùng):
- `Project URL` → dùng làm `VITE_SUPABASE_URL`
- `anon` `public` key (hoặc "Publishable key") → dùng làm `VITE_SUPABASE_ANON_KEY`

Key này được phép nằm trong trình duyệt: quyền đã khoá bằng RLS ở bước 2. **Không** dùng `service_role` / secret key.

Callback URL để dùng ở bước 4: `https://<project-ref>.supabase.co/auth/v1/callback` (thấy trong **Authentication → Sign In / Providers → Google**).

## 4. Tạo OAuth client trên Google
1. Vào https://console.cloud.google.com → tạo project mới tên `So Dan`.
2. **APIs & Services → OAuth consent screen** (giờ tên là **Google Auth Platform**) → Get started:
   - App name: `Sổ Đàn`, support email: email của bạn, Audience: **External**.
   - Mục **Branding** → Authorized domains: thêm `supabase.co` (và `vercel.app` nếu nó hỏi).
   - Mục **Audience** → bấm **Publish app** để ai cũng đăng nhập được (chỉ xin email + tên + ảnh nên không cần Google duyệt).
3. **Clients → Create client** → Application type: **Web application**:
   - Authorized JavaScript origins: `https://guitar-learning-platform-pied.vercel.app` và `http://localhost:5173`
   - Authorized redirect URIs: callback URL ở bước 3.
4. Copy **Client ID** và **Client secret**.

## 5. Bật Google trong Supabase
1. **Authentication → Sign In / Providers → Google** → bật, dán Client ID + Client secret → Save.
2. **Authentication → URL Configuration**:
   - Site URL: `https://guitar-learning-platform-pied.vercel.app`
   - Redirect URLs, thêm:
     - `https://guitar-learning-platform-pied.vercel.app/**`
     - `https://*-nngocminhwork-4571s-projects.vercel.app/**` (cho bản preview của PR)
     - `http://localhost:5173/**`

## 6. Gắn env lên Vercel
Vercel → project **guitar-learning-platform** → **Settings → Environment Variables**, thêm 2 biến cho cả Production và Preview:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Rồi **Deployments → Redeploy** bản mới nhất (biến `VITE_` chỉ ăn khi build lại).

Chạy local: copy `.env.example` thành `.env`, điền 2 giá trị, `npm run dev`.

## Nó hoạt động thế nào
- Chưa đăng nhập: như cũ, mọi thứ ở localStorage + IndexedDB trên máy.
- Đăng nhập lần đầu trên một máy: bài hát, nhật ký và file bản thu đang có trên máy được đẩy lên tài khoản; bài đã có trên cloud được kéo về.
- Đang đăng nhập: sửa gì thì ~1 giây sau tự đồng bộ; quay lại tab hoặc có mạng lại thì kéo thay đổi từ máy khác. Hai máy cùng sửa một bài thì bản sửa sau thắng; bài bị xoá ở máy này nhưng vừa được sửa ở máy kia thì giữ bản sửa.
- Bản thu ghi ở máy khác sẽ tải về khi mở và được cache lại trên máy.
- Đăng xuất: dữ liệu vẫn để trên máy. Nếu một tài khoản **khác** đăng nhập trên cùng máy, app thay dữ liệu trên máy bằng dữ liệu của tài khoản đó (không trộn dữ liệu của hai người).
- Free tier Supabase: 500 MB database, 1 GB file. Bản thu webm ~1 MB/phút, nên khoảng 15 tiếng thu âm.

## Đăng bài công khai (Khám phá)
Cần bảng `public_songs`. Project đã chạy `schema.sql` từ trước thì chạy lại **toàn bộ** file `supabase/schema.sql` trong SQL Editor (file viết kiểu chạy lại bao nhiêu lần cũng được) là có.

- Bài trong **Hợp âm** mặc định là **Nháp**: chỉ mình bạn thấy (lưu trên máy, đồng bộ lên tài khoản nếu đăng nhập).
- Bấm **Đăng công khai** (cần đăng nhập) để chụp một bản lên `public_songs`. Sửa bài sau đó không tự lên bản công khai, phải bấm **Cập nhật bản công khai**.
- Tab **Khám phá**: ai cũng tìm (theo tên bài, tên người đăng), xem, đổi tông và lưu bản sao về sổ mình, không cần đăng nhập. Link `#explore/<id>` mở thẳng một bài.
- RLS: ai cũng đọc được `public_songs`; chỉ chủ bài được thêm, sửa, gỡ.
