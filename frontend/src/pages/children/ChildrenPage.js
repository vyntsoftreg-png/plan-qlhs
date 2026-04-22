import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Space,
  Popconfirm, message, Card, Row, Col, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  fetchChildren, createChild, updateChild, deleteChild,
} from '../../redux/slices/childrenSlice';
import { fetchUsers } from '../../redux/slices/usersSlice';

const { Option } = Select;

export default function ChildrenPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector(state => state.children);
  const { list: teachers } = useSelector(state => state.users);
  const { user } = useSelector(state => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();

  const loadData = (page = 1) => {
    dispatch(fetchChildren({ page, limit: 10, filters: { search } }));
  };

  useEffect(() => {
    loadData(1);
    dispatch(fetchUsers({ page: 1, limit: 100, role: 'teacher' }));
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData(1);
  };

  const handleTableChange = (pag) => {
    setCurrentPage(pag.current);
    loadData(pag.current);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : undefined,
        kindergarten_id: user?.kindergarten_id,
      };
      if (editing) {
        await dispatch(updateChild({ id: editing.id, data: payload })).unwrap();
        message.success('Cập nhật trẻ thành công');
      } else {
        await dispatch(createChild(payload)).unwrap();
        message.success('Thêm trẻ thành công');
      }
      setModalOpen(false);
      loadData(currentPage);
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteChild(id)).unwrap();
      message.success('Xóa trẻ thành công');
      loadData(currentPage);
    } catch (err) {
      message.error(err?.message || 'Xóa thất bại');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'fullname', key: 'fullname' },
    {
      title: 'Ngày sinh', dataIndex: 'date_of_birth', key: 'date_of_birth',
      render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Giới tính', dataIndex: 'gender', key: 'gender',
      render: v => v === 'male' ? 'Nam' : v === 'female' ? 'Nữ' : '—',
    },

    { title: 'Giáo viên', dataIndex: 'teacher_name', key: 'teacher_name', render: v => v || '—' },
    { title: 'SĐT phụ huynh', dataIndex: 'parent_phone', key: 'parent_phone', render: v => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active',
      render: v => <Tag color={v !== false ? 'green' : 'red'}>{v !== false ? 'Đang học' : 'Nghỉ học'}</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý trẻ em"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm trẻ</Button>}
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
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
            showTotal: t => `Tổng ${t} trẻ`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa thông tin trẻ' : 'Thêm trẻ mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullname" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh" rules={[{ required: true, message: 'Nhập ngày sinh' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Option value="male">Nam</Option>
                  <Option value="female">Nữ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Trạng thái">
                <Select>
                  <Option value={true}>Đang học</Option>
                  <Option value={false}>Nghỉ học</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parent_phone" label="SĐT phụ huynh">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parent_email" label="Email phụ huynh">
                <Input type="email" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacher_id" label="Giáo viên phụ trách">
                <Select placeholder="Chọn giáo viên" allowClear showSearch optionFilterProp="children">
                  {teachers.map(t => (
                    <Option key={t.id} value={t.id}>{t.fullname}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="special_notes" label="Ghi chú đặc biệt">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
