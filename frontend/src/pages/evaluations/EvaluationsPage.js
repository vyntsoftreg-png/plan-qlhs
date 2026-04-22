import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Select, Input, Space, Popconfirm,
  message, Card, Row, Col, Tag, Spin, Divider, Typography, Image,
} from 'antd';
import {
  EditOutlined, CheckCircleOutlined, DownloadOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlans, deletePlan } from '../../redux/slices/plansSlice';
import api from '../../api/axios';

const { Option } = Select;
const { Text } = Typography;

const STATUS_LABELS = { achieved: 'Đạt', partial: 'Đạt một phần', not_achieved: 'Chưa đạt', pending: 'Chưa đánh giá' };
const STATUS_COLORS = { achieved: 'green', partial: 'orange', not_achieved: 'red', pending: 'default' };
const PLAN_STATUS_LABELS = { draft: 'Nháp', submitted: 'Đã nộp', approved: 'Đã duyệt', completed: 'Hoàn thành' };
const PLAN_STATUS_COLORS = { draft: 'default', submitted: 'blue', approved: 'green', completed: 'cyan' };

export default function EvaluationsPage() {
  const dispatch = useDispatch();
  const { list: plans, pagination, loading } = useSelector(state => state.plans);

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetail, setPlanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [approverName, setApproverName] = useState('');
  const [form] = Form.useForm();

  const loadData = (page = 1, status = statusFilter) => {
    dispatch(fetchPlans({ page, limit: 10, status }));
  };

  useEffect(() => { loadData(1); }, []);

  const openEvaluate = async (plan) => {
    setSelectedPlan(plan);
    setDetailLoading(true);
    setEvalModalOpen(true);
    try {
      const res = await api.get(`/plans/${plan.id}`);
      if (res.data.code === 'SUCCESS') {
        setPlanDetail(res.data.data);
        setApproverName(res.data.data.approver_name || '');
      }
    } catch {
      message.error('Không tải được chi tiết kế hoạch');
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadPlanDetail = async () => {
    if (!selectedPlan) return;
    try {
      const res = await api.get(`/plans/${selectedPlan.id}`);
      if (res.data.code === 'SUCCESS') setPlanDetail(res.data.data);
    } catch { /* ignore */ }
  };

  const startEditGoal = (goal) => {
    setEditGoal(goal);
    form.setFieldsValue({
      result_status: goal.result_status === 'pending' ? undefined : goal.result_status,
      result_notes: goal.result_notes || '',
    });
  };

  const handleSaveGoalEval = async () => {
    try {
      const values = await form.validateFields();
      await api.put(`/plans/${selectedPlan.id}/goals/${editGoal.id}`, {
        result_status: values.result_status,
        result_notes: values.result_notes || '',
      });
      message.success('Lưu đánh giá thành công');
      setEditGoal(null);
      await reloadPlanDetail();
      loadData(currentPage);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu thất bại');
    }
  };

  const handleExport = async () => {
    if (!selectedPlan) return;
    try {
      // Save approver_name before export
      await api.put(`/plans/${selectedPlan.id}`, { approver_name: approverName });

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/plans/${selectedPlan.id}/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DanhGia_${(selectedPlan.child_name || 'plan').replace(/\s+/g, '_')}_T${selectedPlan.month}_${selectedPlan.year}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success('Xuất file thành công');
    } catch {
      message.error('Xuất file thất bại');
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
    { title: 'Tháng/Năm', key: 'period', render: (_, r) => `Tháng ${r.month}/${r.year}` },
    { title: 'Tên trẻ', dataIndex: 'child_name', key: 'child_name' },
    { title: 'Giáo viên', dataIndex: 'teacher_name', key: 'teacher_name', render: v => v || '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={PLAN_STATUS_COLORS[v] || 'default'}>{PLAN_STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => openEvaluate(record)} type="primary" ghost>
            Đánh giá
          </Button>
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
      <Card title="Đánh giá mục tiêu kế hoạch">
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              placeholder="Lọc trạng thái"
              value={statusFilter || undefined}
              onChange={v => { setStatusFilter(v || ''); setCurrentPage(1); loadData(1, v || ''); }}
              allowClear
              style={{ width: 200 }}
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
          dataSource={plans}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: pagination?.total || 0,
            showTotal: t => `Tổng ${t} kế hoạch`,
          }}
          onChange={pag => { setCurrentPage(pag.current); loadData(pag.current); }}
        />
      </Card>

      <Modal
        title={
          selectedPlan
            ? `Đánh giá: Tháng ${selectedPlan.month}/${selectedPlan.year} — ${selectedPlan.child_name}`
            : 'Đánh giá'
        }
        open={evalModalOpen}
        onCancel={() => { setEvalModalOpen(false); setEditGoal(null); setPlanDetail(null); setApproverName(''); }}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport} type="primary">
              Xuất file đánh giá
            </Button>
            <Button onClick={() => { setEvalModalOpen(false); setEditGoal(null); setPlanDetail(null); setApproverName(''); }}>
              Đóng
            </Button>
          </Space>
        }
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Người phê duyệt: </Text>
          <Input
            placeholder="Nhập tên người phê duyệt"
            value={approverName}
            onChange={e => setApproverName(e.target.value)}
            style={{ width: 300, marginLeft: 8 }}
          />
        </div>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : planDetail ? (
          <div>
            {(() => {
              const { grouped, order } = groupGoals(planDetail.goals);
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
                        marginBottom: 12, padding: '10px 14px',
                        border: '1px solid #f0f0f0', borderRadius: 6,
                      }}
                    >
                      <Row align="top" justify="space-between">
                        <Col flex="auto" style={{ maxWidth: 'calc(100% - 100px)' }}>
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
                          <div style={{ marginTop: 6 }}>
                            <Tag color={STATUS_COLORS[goal.result_status] || 'default'}>
                              {STATUS_LABELS[goal.result_status] || 'Chưa đánh giá'}
                            </Tag>
                            {goal.result_notes && (
                              <Text type="secondary" style={{ marginLeft: 8, whiteSpace: 'pre-line' }}>{goal.result_notes}</Text>
                            )}
                          </div>
                        </Col>
                        <Col>
                          <Button size="small" icon={<EditOutlined />} onClick={() => startEditGoal(goal)}>
                            Đánh giá
                          </Button>
                        </Col>
                      </Row>
                      {editGoal?.id === goal.id && (
                        <div style={{ marginTop: 8, padding: 10, background: '#fafafa', borderRadius: 4 }}>
                          <Form form={form} layout="vertical">
                            <Row gutter={12}>
                              <Col span={8}>
                                <Form.Item name="result_status" rules={[{ required: true, message: 'Chọn kết quả' }]}>
                                  <Select placeholder="Kết quả" style={{ width: '100%' }}>
                                    <Option value="achieved">Đạt</Option>
                                    <Option value="partial">Đạt một phần</Option>
                                    <Option value="not_achieved">Chưa đạt</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={16}>
                                <Form.Item name="result_notes">
                                  <Input.TextArea rows={3} placeholder="Ghi chú..." />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Form.Item style={{ marginBottom: 0 }}>
                              <Space>
                                <Button type="primary" size="small" onClick={handleSaveGoalEval}>Lưu</Button>
                                <Button size="small" onClick={() => setEditGoal(null)}>Hủy</Button>
                              </Space>
                            </Form.Item>
                          </Form>
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
