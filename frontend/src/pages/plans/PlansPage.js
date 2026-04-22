import React, { useEffect, useState, useRef } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, message, Card, Row, Col, Tag, Divider, Typography, Image, Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, SyncOutlined, CopyOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../../redux/slices/plansSlice';
import { fetchChildren } from '../../redux/slices/childrenSlice';
import { fetchTemplates } from '../../redux/slices/templatesSlice';
import { fetchUsers } from '../../redux/slices/usersSlice';
import api from '../../api/axios';

const { Option } = Select;
const { Text } = Typography;

const STATUS_LABELS = {
  draft: 'Nháp', submitted: 'Đã nộp', approved: 'Đã duyệt', completed: 'Hoàn thành',
};
const STATUS_COLORS = {
  draft: 'default', submitted: 'blue', approved: 'green', completed: 'cyan',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function PlansPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector(state => state.plans);
  const { list: children } = useSelector(state => state.children);
  const { list: templates } = useSelector(state => state.templates);
  const { list: users } = useSelector(state => state.users);
  const { user } = useSelector(state => state.auth);

  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin' || u.role === 'principal');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();
  const [syncing, setSyncing] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState(null);
  const [cloneForm] = Form.useForm();
  const [cloning, setCloning] = useState(false);
  // Review modal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPlan, setReviewPlan] = useState(null);
  const [reviewDetail, setReviewDetail] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [approverName, setApproverName] = useState('');

  const loadData = (page = 1) => {
    dispatch(fetchPlans({ page, limit: 10, status: statusFilter }));
  };

  useEffect(() => {
    loadData(1);
    dispatch(fetchChildren({ page: 1, limit: 100, filters: {} }));
    dispatch(fetchTemplates({ page: 1, limit: 100, kindergarten_id: user?.kindergarten_id }));
    dispatch(fetchUsers({ page: 1, limit: 100 }));
  }, []);

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
    form.setFieldsValue({
      child_id: record.child_id,
      month: record.month,
      year: record.year,
      teacher_id: record.teacher_id,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        const { status, teacher_id } = values;
        await dispatch(updatePlan({ id: editing.id, data: { status, teacher_id } })).unwrap();
        message.success('Cập nhật kế hoạch thành công');
      } else {
        const payload = { ...values };
        payload.teacher_id = values.teacher_id || user?.id;
        await dispatch(createPlan(payload)).unwrap();
        message.success('Tạo kế hoạch thành công');
      }
      setModalOpen(false);
      loadData(currentPage);
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const handleSyncTemplate = async () => {
    if (!editing) return;
    setSyncing(true);
    try {
      const res = await api.post(`/plans/${editing.id}/sync-template`);
      if (res.data.code === 'SUCCESS') {
        message.success(res.data.message);
        loadData(currentPage);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Đồng bộ mẫu thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const openClone = (record) => {
    setCloneSource(record);
    cloneForm.resetFields();
    cloneForm.setFieldsValue({ month: record.month, year: record.year });
    setCloneModalOpen(true);
  };

  const handleClone = async () => {
    try {
      const values = await cloneForm.validateFields();
      setCloning(true);
      const res = await api.post(`/plans/${cloneSource.id}/clone`, values);
      if (res.data.code === 'SUCCESS') {
        message.success('Sao chép kế hoạch thành công');
        setCloneModalOpen(false);
        loadData(currentPage);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Sao chép thất bại');
    } finally {
      setCloning(false);
    }
  };

  const openReview = async (record) => {
    setReviewPlan(record);
    setReviewLoading(true);
    setReviewOpen(true);
    try {
      const res = await api.get(`/plans/${record.id}`);
      if (res.data.code === 'SUCCESS') {
        setReviewDetail(res.data.data);
        setApproverName(res.data.data.approver_name || '');
      }
    } catch {
      message.error('Không tải được chi tiết kế hoạch');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleExportPlan = async () => {
    if (!reviewPlan) return;
    try {
      // Save approver_name before export
      await api.put(`/plans/${reviewPlan.id}`, { approver_name: approverName });
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/plans/${reviewPlan.id}/export-plan`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KeHoach_${(reviewPlan.child_name || 'plan').replace(/\s+/g, '_')}_T${reviewPlan.month}_${reviewPlan.year}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success('Xuất kế hoạch thành công');
    } catch {
      message.error('Xuất kế hoạch thất bại');
    }
  };

  // Group goals by skill_name
  const groupGoals = (goals) => {
    const grouped = {};
    const order = [];
    (goals || []).forEach(g => {
      if (!grouped[g.skill_name]) {
        grouped[g.skill_name] = [];
        order.push(g.skill_name);
      }
      grouped[g.skill_name].push(g);
    });
    return { grouped, order };
  };

  const columns = [
    {
      title: 'Tháng/Năm', key: 'period',
      render: (_, r) => `Tháng ${r.month}/${r.year}`,
    },
    { title: 'Tên trẻ', dataIndex: 'child_name', key: 'child_name' },
    { title: 'Giáo viên', dataIndex: 'teacher_name', key: 'teacher_name', render: v => v || '—' },
    { title: 'Mẫu KH', dataIndex: 'template_name', key: 'template_name', ellipsis: true, render: v => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Kỹ năng', key: 'skills',
      render: (_, r) => `${r.skills_achieved || 0}/${r.skills_total || 0} đạt`,
    },
    {
      title: 'Thao tác', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} title="Xem / Xuất" onClick={() => openReview(record)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button size="small" icon={<CopyOutlined />} title="Sao chép" onClick={() => openClone(record)} />
          <Popconfirm
            title="Xóa kế hoạch?"
            description="Bạn có chắc chắn muốn xóa kế hoạch này?"
            onConfirm={async () => {
              try {
                await dispatch(deletePlan(record.id)).unwrap();
                message.success('Xóa kế hoạch thành công');
                loadData(currentPage);
              } catch (err) {
                message.error(err || 'Xóa thất bại');
              }
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý kế hoạch giáo dục"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo kế hoạch</Button>}
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              placeholder="Lọc trạng thái"
              value={statusFilter || undefined}
              onChange={v => { setStatusFilter(v || ''); setCurrentPage(1); dispatch(fetchPlans({ page: 1, limit: 10, status: v || '' })); }}
              allowClear
              style={{ width: 160 }}
            >
              <Option value="draft">Nháp</Option>
              <Option value="submitted">Đã nộp</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="completed">Hoàn thành</Option>
            </Select>
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
            showTotal: t => `Tổng ${t} kế hoạch`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa kế hoạch' : 'Tạo kế hoạch mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={520}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {editing && (
                <Button
                  icon={<SyncOutlined />}
                  loading={syncing}
                  onClick={handleSyncTemplate}
                >
                  Cập nhật mẫu KH
                </Button>
              )}
            </div>
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        )}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="child_id" label="Trẻ em" rules={[{ required: true, message: 'Chọn trẻ' }]}>
            <Select
              placeholder="Chọn trẻ"
              showSearch
              optionFilterProp="children"
              disabled={!!editing}
            >
              {children.map(c => (
                <Option key={c.id} value={c.id}>{c.fullname}</Option>
              ))}
            </Select>
          </Form.Item>
          {!editing && (
            <Form.Item name="template_id" label="Mẫu kế hoạch" rules={[{ required: true, message: 'Chọn mẫu kế hoạch' }]}>
              <Select placeholder="Chọn mẫu kế hoạch" showSearch optionFilterProp="children">
                {templates.map(t => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="month" label="Tháng" rules={[{ required: true, message: 'Chọn tháng' }]}>
                <Select placeholder="Tháng">
                  {MONTHS.map(m => <Option key={m} value={m}>Tháng {m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Năm" rules={[{ required: true, message: 'Chọn năm' }]}>
                <Select placeholder="Năm">
                  {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="teacher_id" label="Giáo viên phụ trách" rules={[{ required: true, message: 'Chọn giáo viên' }]}>
            <Select placeholder="Chọn giáo viên" showSearch optionFilterProp="children">
              {teachers.map(t => (
                <Option key={t.id} value={t.id}>{t.fullname}</Option>
              ))}
            </Select>
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value="draft">Nháp</Option>
                <Option value="submitted">Đã nộp</Option>
                <Option value="approved">Đã duyệt</Option>
                <Option value="completed">Hoàn thành</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Sao chép kế hoạch${cloneSource ? ` - ${cloneSource.child_name} T${cloneSource.month}/${cloneSource.year}` : ''}`}
        open={cloneModalOpen}
        onOk={handleClone}
        onCancel={() => setCloneModalOpen(false)}
        okText="Sao chép"
        cancelText="Hủy"
        confirmLoading={cloning}
        width={480}
      >
        <Form form={cloneForm} layout="vertical">
          <Form.Item name="child_id" label="Trẻ em" rules={[{ required: true, message: 'Chọn trẻ' }]}>
            <Select placeholder="Chọn trẻ" showSearch optionFilterProp="children">
              {children.map(c => (
                <Option key={c.id} value={c.id}>{c.fullname}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="month" label="Tháng" rules={[{ required: true, message: 'Chọn tháng' }]}>
                <Select placeholder="Tháng">
                  {MONTHS.map(m => <Option key={m} value={m}>Tháng {m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Năm" rules={[{ required: true, message: 'Chọn năm' }]}>
                <Select placeholder="Năm">
                  {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Review / Export Plan Modal */}
      <Modal
        title={
          reviewPlan
            ? `Xem kế hoạch: Tháng ${reviewPlan.month}/${reviewPlan.year} — ${reviewPlan.child_name}`
            : 'Xem kế hoạch'
        }
        open={reviewOpen}
        onCancel={() => { setReviewOpen(false); setReviewDetail(null); setReviewPlan(null); setApproverName(''); }}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportPlan} type="primary">
              Xuất kế hoạch
            </Button>
            <Button onClick={() => { setReviewOpen(false); setReviewDetail(null); setReviewPlan(null); setApproverName(''); }}>
              Đóng
            </Button>
          </Space>
        }
        width={850}
      >
        {reviewLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : reviewDetail ? (
          <div>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}><Text strong>Họ và tên trẻ:</Text> {reviewDetail.child_name}</Col>
              <Col span={12}><Text strong>Giáo viên:</Text> {reviewDetail.teacher_name || '—'}</Col>
            </Row>
            {reviewPlan?.template_name && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Mẫu kế hoạch:</Text> <Tag color="blue">{reviewPlan.template_name}</Tag>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Text strong>Người phê duyệt: </Text>
              <Input
                placeholder="Nhập tên người phê duyệt"
                value={approverName}
                onChange={e => setApproverName(e.target.value)}
                style={{ width: 300, marginLeft: 8 }}
              />
            </div>
            {(() => {
              const { grouped, order } = groupGoals(reviewDetail.goals);
              if (order.length === 0) {
                return <Text type="secondary">Kế hoạch chưa có mục tiêu nào</Text>;
              }
              return order.map(skillName => (
                <div key={skillName}>
                  <Divider orientation="left">
                    <Tag color="blue" style={{ fontSize: 14 }}>{skillName}</Tag>
                  </Divider>
                  {grouped[skillName].map(goal => (
                    <div
                      key={goal.id}
                      style={{
                        marginBottom: 10, padding: '10px 14px',
                        border: '1px solid #f0f0f0', borderRadius: 6,
                      }}
                    >
                      <Text strong style={{ fontSize: 14 }}>{goal.goal_title}</Text>
                      {goal.activities && (
                        <div style={{ marginTop: 4, color: '#666', whiteSpace: 'pre-line' }}>
                          {goal.activities}
                        </div>
                      )}
                      {goal.image_url && (
                        <div style={{ marginTop: 6 }}>
                          <Image
                            src={`http://localhost:5000${goal.image_url}`}
                            width={120}
                            style={{ borderRadius: 4 }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        ) : (
          <Text type="secondary">Không có dữ liệu</Text>
        )}
      </Modal>
    </div>
  );
}
