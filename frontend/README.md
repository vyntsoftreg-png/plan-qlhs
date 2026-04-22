# Frontend QLHS

Frontend cho hệ thống quản lý giáo dục mầm non.

## Công nghệ sử dụng

- **React 18** - Thư viện UI
- **React Router v6** - Định tuyến
- **Ant Design v5** - Component UI
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **ECharts** - Biểu đồ

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Build

```bash
npm run build
```

## Cấu trúc dự án

```
src/
  ├── api/              # Cấu hình axios
  ├── components/       # React components
  ├── layouts/          # Layout components
  ├── middleware/       # Middleware (PrivateRoute, etc)
  ├── pages/            # Page components
  ├── redux/            # Redux store, slices, actions
  ├── utils/            # Utility functions
  ├── App.js            # Root component
  └── index.js          # Entry point
```

## Tính năng

- **Xác thực**: Đăng nhập, quản lý token
- **Quản lý trẻ em**: CRUD, filtering, searching
- **Kế hoạch học tập**: Tạo và quản lý kế hoạch
- **Đánh giá kỹ năng**: Ghi lại sự phát triển
- **Thống kê**: Analytics và báo cáo
- **Cài đặt**: Quản lý người dùng, cấu hình

## Biến môi trường

Tạo file `.env` với nội dung sau:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

Để chạy ở chế độ development:

```bash
npm start
```

Ứng dụng sẽ tự động reload khi bạn thay đổi code.

## Testing

```bash
npm test
```
