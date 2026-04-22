import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, message, Card, Row, Col, Tag, Divider, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  MinusCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSkills, createSkill, updateSkill, deleteSkill } from '../../redux/slices/skillsSlice';
import api from '../../api/axios';

const { Option } = Select;

export default function SkillsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector(state => state.skills);
  const { user } = useSelector(state => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [devAreas, setDevAreas] = useState([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [viewSkill, setViewSkill] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const loadData = (page = 1) => {
    const params = { page, limit: 20, kindergarten_id: user?.kindergarten_id };
    if (search) params.search = search;
    if (areaFilter) params.development_area_id = areaFilter;
    dispatch(fetchSkills(params));
  };

  useEffect(() => {
    loadData(1);
    api.get('/skills/development-areas').then(res => {
      if (res.data.code === 'SUCCESS') setDevAreas(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSearch = () => { setCurrentPage(1); loadData(1); };

  const handleTableChange = (pag) => {
    setCurrentPage(pag.current);
    loadData(pag.current);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ goals: [{ goal_title: '', activities: '' }] });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditing(record);
    try {
      const res = await api.get(`/skills/${record.id}`);
      const skill = res.data.data;
      form.setFieldsValue({
        name: skill.name,
        development_area_id: skill.development_area_id,
        description: skill.description || '',
        instruction_text: skill.instruction_text || '',
        goals: skill.goals && skill.goals.length > 0
          ? skill.goals.map(g => ({ goal_title: g.goal_title, activities: g.activities || '' }))
          : [{ goal_title: '', activities: '' }],
      });
      setModalOpen(true);
    } catch {
      message.error('Không tải được thông tin kỹ năng');
    }
  };

  const openView = async (record) => {
    try {
      const res = await api.get(`/skills/${record.id}`);
      setViewSkill(res.data.data);
      setViewOpen(true);
    } catch {
      message.error('Không tải được thông tin kỹ năng');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        name: values.name,
        development_area_id: values.development_area_id,
        description: values.description || '',
        instruction_text: values.instruction_text || '',
        goals: (values.goals || []).filter(g => g.goal_title),
      };
      if (editing) {
        await dispatch(updateSkill({ id: editing.id, data: payload })).unwrap();
        message.success('Cập nhật kỹ năng thành công');
      } else {
        await dispatch(createSkill(payload)).unwrap();
        message.success('Thêm kỹ năng thành công');
      }
      setModalOpen(false);
      loadData(currentPage);
    } catch (err) {
      if (err?.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteSkill(id)).unwrap();
      message.success('Xóa kỹ năng thành công');
      loadData(currentPage);
    } catch (err) {
      message.error(err?.message || 'Xóa thất bại');
    }
  };

  const columns = [
    { title: 'Tên kỹ năng', dataIndex: 'name', key: 'name', width: '25%' },
    {
      title: 'Lĩnh vực phát triển', key: 'development_area', width: '20%',
      render: (_, row) => {
        const area = devAreas.find(a => a.id === row.development_area_id);
        return area ? <Tag color={area.color_code || 'blue'}>{area.name}</Tag> : (row.development_area_name || '—');
      },
    },
    {
      title: 'Số mục tiêu', key: 'goal_count', width: '10%', align: 'center',
      render: (_, row) => <Badge count={row.goal_count || 0} showZero overflowCount={99} style={{ backgroundColor: (row.goal_count > 0) ? '#52c41a' : '#bfbfbf' }} />,
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'description',
      ellipsis: true, render: v => v || '—',
    },
    {
      title: 'Thao tác', key: 'actions', width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openView(record)} title="Xem chi tiết" />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} title="Sửa" />
          <Popconfirm title="Xác nhận xóa kỹ năng?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" icon={<DeleteOutlined />} danger title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý kỹ năng"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm kỹ năng</Button>}
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm theo tên kỹ năng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </Col>
          <Col>
            <Select
              placeholder="Lọc lĩnh vực"
              value={areaFilter || undefined}
              onChange={v => { setAreaFilter(v || ''); }}
              allowClear
              style={{ width: 200 }}
            >
              {devAreas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
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
            pageSize: 20,
            total: pagination?.total || 0,
            showTotal: t => `Tổng ${t} kỹ năng`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={700}
        confirmLoading={submitting}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Tên kỹ năng" rules={[{ required: true, message: 'Nhập tên kỹ năng' }]}>
                <Input placeholder="VD: VẬN ĐỘNG THÔ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="development_area_id" label="Lĩnh vực phát triển" rules={[{ required: true, message: 'Chọn lĩnh vực' }]}>
                <Select placeholder="Chọn lĩnh vực phát triển">
                  {devAreas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về kỹ năng" />
          </Form.Item>
          <Form.Item name="instruction_text" label="Hướng dẫn thực hiện">
            <Input.TextArea rows={2} placeholder="Hướng dẫn cho giáo viên" />
          </Form.Item>

          <Divider>Mục tiêu &amp; Hoạt động</Divider>

          <Form.List name="goals">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12, background: '#fafafa' }}
                    title={`Mục tiêu ${index + 1}`}
                    extra={fields.length > 1 && (
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                    )}
                  >
                    <Form.Item
                      name={[field.name, 'goal_title']}
                      label="Tên mục tiêu"
                      rules={[{ required: true, message: 'Nhập tên mục tiêu' }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="VD: Ngồi lăn bóng về phía trước" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'activities']}
                      label="Hoạt động"
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea rows={3} placeholder="Mô tả các hoạt động thực hiện mục tiêu..." />
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ goal_title: '', activities: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm mục tiêu
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        title={viewSkill ? `Chi tiết: ${viewSkill.name}` : 'Chi tiết kỹ năng'}
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={<Button onClick={() => setViewOpen(false)}>Đóng</Button>}
        width={650}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {viewSkill && (
          <div>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <strong>Lĩnh vực:</strong>{' '}
                <Tag color={viewSkill.color_code || 'blue'}>{viewSkill.development_area_name}</Tag>
              </Col>
              <Col span={12}>
                <strong>Số mục tiêu:</strong> {viewSkill.goals?.length || 0}
              </Col>
            </Row>
            {viewSkill.description && (
              <div style={{ marginBottom: 12 }}>
                <strong>Mô tả:</strong> {viewSkill.description}
              </div>
            )}
            {viewSkill.instruction_text && (
              <div style={{ marginBottom: 12 }}>
                <strong>Hướng dẫn:</strong> {viewSkill.instruction_text}
              </div>
            )}
            <Divider>Mục tiêu &amp; Hoạt động</Divider>
            {viewSkill.goals && viewSkill.goals.length > 0 ? (
              viewSkill.goals.map((g, i) => (
                <Card key={g.id} size="small" style={{ marginBottom: 8, background: '#fafafa' }} title={`${i + 1}. ${g.goal_title}`}>
                  {g.activities ? (
                    <div style={{ whiteSpace: 'pre-wrap', color: '#595959' }}>{g.activities}</div>
                  ) : (
                    <span style={{ color: '#bfbfbf' }}>Chưa có hoạt động</span>
                  )}
                </Card>
              ))
            ) : (
              <div style={{ color: '#bfbfbf', textAlign: 'center', padding: 16 }}>Chưa có mục tiêu nào</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
