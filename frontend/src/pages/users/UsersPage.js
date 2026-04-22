import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, message, Card, Row, Col, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../redux/slices/usersSlice';

const { Option } = Select;

const ROLE_LABELS = { admin: 'Admin', principal: 'Hiệu trưởng', teacher: 'Giáo viên', parent: 'Phụ huynh' };
const ROLE_COLORS = { admin: 'red', principal: 'blue', teacher: 'green', parent: 'orange' };

export default function UsersPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector(state => state.users);
  const { user: currentUser } = useSelector(state => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();

  const loadData = (page = 1) => {
    dispatch(fetchUsers({ page, limit: 10, role: roleFilter, kindergarten_id: currentUser?.kindergarten_id }));
  };

  useEffect(() => { loadData(1); }, []);

  const handleTableChange = (pag) => {
    setCurrentPage(pag.current);
    loadData(pag.current);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ fullname: record.fullname, email: record.email, role: record.role, phone: record.phone });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, kindergarten_id: currentUser?.kindergarten_id };
      if (editing) {
        await dispatch(updateUser({ id: editing.id, data: payload })).unwrap();
        message.success('Cập nhật thành công');
      } else {
        await dispatch(createUser(payload)).unwrap();
        message.success('Tạo tài khoản thành công');
      }
      setModalOpen(false);
      loadData(currentPage);
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      message.success('Xóa tài khoản thành công');
      loadData(currentPage);
    } catch (err) {
      message.error(err?.message || 'Xóa thất bại');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'fullname', key: 'fullname' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', render: v => v || '—' },
    {
      title: 'Vai trò', dataIndex: 'role', key: 'role',
      render: v => <Tag color={ROLE_COLORS[v] || 'default'}>{ROLE_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active',
      render: v => <Tag color={v !== false ? 'green' : 'red'}>{v !== false ? 'Hoạt động' : 'Khóa'}</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Xác nhận xóa tài khoản?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" icon={<DeleteOutlined />} danger disabled={record.id === currentUser?.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý người dùng"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm người dùng</Button>}
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm theo tên / email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onPressEnter={() => { setCurrentPage(1); loadData(1); }}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Lọc vai trò"
              value={roleFilter || undefined}
              onChange={v => { setRoleFilter(v || ''); setCurrentPage(1); loadData(1); }}
              allowClear
              style={{ width: 150 }}
            >
              <Option value="admin">Admin</Option>
              <Option value="principal">Hiệu trưởng</Option>
              <Option value="teacher">Giáo viên</Option>
              <Option value="parent">Phụ huynh</Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary" onClick={() => { setCurrentPage(1); loadData(1); }}>Tìm kiếm</Button>
          </Col>
        </Row>
        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: pagination?.total || 0,
            showTotal: t => `Tổng ${t} người dùng`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fullname" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Mật khẩu ít nhất 6 ký tự' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
                <Select placeholder="Chọn vai trò">
                  <Option value="principal">Hiệu trưởng</Option>
                  <Option value="teacher">Giáo viên</Option>
                  <Option value="parent">Phụ huynh</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
