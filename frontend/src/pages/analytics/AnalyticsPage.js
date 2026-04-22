import React, { useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Spin, Empty,
  Progress, Typography,
} from 'antd';
import {
  UserOutlined, FileTextOutlined, CheckCircleOutlined,
  TrophyOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../../redux/slices/analyticsSlice';

const { Title, Text } = Typography;

const MONTH_NAMES = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { overview: analytics, loading } = useSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics({}));
  }, [dispatch]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;

  if (!analytics) return (
    <Card title="Thống kê & Báo cáo">
      <Empty description="Không có dữ liệu thống kê. Vui lòng kiểm tra cấu hình trường học." />
    </Card>
  );

  const { overview, evaluation_stats, top_teachers, top_skills, monthly_trend } = analytics;

  const successRate = evaluation_stats?.total_evaluations
    ? Math.round((evaluation_stats.achieved / evaluation_stats.total_evaluations) * 100)
    : 0;

  const teacherColumns = [
    { title: 'Giáo viên', dataIndex: 'name', key: 'name' },
    { title: 'Số trẻ', dataIndex: 'children_count', key: 'children_count' },
    { title: 'KH tạo', dataIndex: 'plans_created', key: 'plans_created' },
    { title: 'KH hoàn thành', dataIndex: 'plans_completed', key: 'plans_completed' },
    {
      title: 'Tỷ lệ hoàn thành', key: 'rate',
      render: (_, r) => {
        const rate = r.plans_created ? Math.round((r.plans_completed / r.plans_created) * 100) : 0;
        return <Progress percent={rate} size="small" style={{ width: 120 }} />;
      },
    },
  ];

  const skillColumns = [
    { title: 'Kỹ năng', dataIndex: 'name', key: 'name' },
    { title: 'Lĩnh vực', dataIndex: 'development_area', key: 'development_area', render: v => v || '—' },
    { title: 'Số lần dùng', dataIndex: 'times_used', key: 'times_used' },
    { title: 'Số đạt', dataIndex: 'achieved_count', key: 'achieved_count' },
    {
      title: 'Tỷ lệ đạt', dataIndex: 'success_rate', key: 'success_rate',
      render: v => <Progress percent={v || 0} size="small" style={{ width: 100 }} strokeColor="#52c41a" />,
    },
  ];

  const trendColumns = [
    {
      title: 'Tháng', key: 'period',
      render: (_, r) => `${MONTH_NAMES[r.month]}/${r.year}`,
    },
    { title: 'KH tạo mới', dataIndex: 'plans_created', key: 'plans_created' },
    { title: 'KH hoàn thành', dataIndex: 'plans_completed', key: 'plans_completed' },
    {
      title: 'Tỷ lệ', key: 'rate',
      render: (_, r) => {
        const rate = r.plans_created ? Math.round((r.plans_completed / r.plans_created) * 100) : 0;
        return `${rate}%`;
      },
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Thống kê & Báo cáo</Title>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng trẻ em" value={overview?.total_children || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng kế hoạch" value={overview?.total_plans || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="KH hoàn thành" value={overview?.completed_plans || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ kỹ năng đạt"
              value={successRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: successRate >= 70 ? '#3f8600' : successRate >= 40 ? '#d46b08' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Evaluation Stats */}
      {evaluation_stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card title="Phân bổ kết quả đánh giá">
              <Row gutter={16}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Statistic title={<Tag color="green">Đạt</Tag>} value={evaluation_stats.achieved || 0} />
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Statistic title={<Tag color="orange">Đạt một phần</Tag>} value={evaluation_stats.partial || 0} />
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Statistic title={<Tag color="red">Chưa đạt</Tag>} value={evaluation_stats.not_achieved || 0} />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Đã đánh giá: {evaluation_stats.total_evaluations || 0} / {evaluation_stats.total_goals || 0} mục tiêu</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Xu hướng hoàn thành (6 tháng gần nhất)">
              <Table
                rowKey={r => `${r.year}-${r.month}`}
                dataSource={monthly_trend || []}
                columns={trendColumns}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Top Teachers */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Hiệu suất giáo viên">
            <Table
              rowKey="teacher_id"
              dataSource={top_teachers || []}
              columns={teacherColumns}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Không có dữ liệu' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Kỹ năng được đánh giá cao nhất">
            <Table
              rowKey="skill_id"
              dataSource={top_skills || []}
              columns={skillColumns}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Không có dữ liệu' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
