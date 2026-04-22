import React, { useEffect, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, Empty, Button, Tag, Progress, Typography, List, Badge } from 'antd';
import {
  UserOutlined, FileTextOutlined, CheckCircleOutlined, BarChartOutlined,
  WarningOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { fetchChildren } from '../../redux/slices/childrenSlice';
import { fetchPlans } from '../../redux/slices/plansSlice';
import { fetchAnalytics } from '../../redux/slices/analyticsSlice';

const { Text } = Typography;

const STATUS_LABELS = {
  draft: 'Nháp', submitted: 'Đã nộp', approved: 'Đã duyệt', completed: 'Hoàn thành',
};
const STATUS_COLORS = {
  draft: 'default', submitted: 'blue', approved: 'green', completed: 'cyan',
};

const ACTION_LABELS = {
  login: 'Đăng nhập', logout: 'Đăng xuất',
  plan_created: 'Tạo kế hoạch', plan_updated: 'Cập nhật KH', plan_deleted: 'Xóa KH',
  child_created: 'Thêm trẻ', child_updated: 'Cập nhật trẻ', child_deleted: 'Xóa trẻ',
  evaluation_created: 'Tạo đánh giá', evaluation_updated: 'Cập nhật ĐG', goal_evaluated: 'Đánh giá mục tiêu',
  user_created: 'Thêm người dùng', user_updated: 'Cập nhật ND', user_deleted: 'Xóa ND',
  skill_created: 'Thêm kỹ năng', skill_updated: 'Cập nhật KN', skill_deleted: 'Xóa KN',
};

const useChart = (option) => {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    if (option) chartRef.current.setOption(option, true);
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [option]);
  return ref;
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: children } = useSelector(state => state.children);
  const { list: plans } = useSelector(state => state.plans);
  const { overview: analytics, loading: analyticsLoading } = useSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchChildren({ page: 1, limit: 5 }));
    dispatch(fetchPlans({ page: 1, limit: 5 }));
    dispatch(fetchAnalytics({}));
  }, [dispatch]);

  const overview = analytics?.overview || {};
  const evalStats = analytics?.evaluation_stats || {};
  const topSkills = analytics?.top_skills || [];
  const monthlyTrend = analytics?.monthly_trend || [];
  const missingPlans = analytics?.children_missing_plans || [];
  const recentActivities = analytics?.recent_activities || [];
  const topTeachers = analytics?.top_teachers || [];

  // Plan status pie chart
  const planStatusOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      label: { show: false },
      data: [
        { value: overview.draft_plans || 0, name: 'Nháp', itemStyle: { color: '#bfbfbf' } },
        { value: overview.submitted_plans || 0, name: 'Đã nộp', itemStyle: { color: '#1890ff' } },
        { value: overview.approved_plans || 0, name: 'Đã duyệt', itemStyle: { color: '#52c41a' } },
        { value: overview.completed_plans || 0, name: 'Hoàn thành', itemStyle: { color: '#13c2c2' } },
      ].filter(d => d.value > 0),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  };
  const planStatusRef = useChart(overview.total_plans > 0 ? planStatusOption : null);

  // Evaluation donut chart
  const evalOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      label: { show: false },
      data: [
        { value: evalStats.achieved || 0, name: 'Đạt', itemStyle: { color: '#52c41a' } },
        { value: evalStats.partial || 0, name: 'Đạt 1 phần', itemStyle: { color: '#faad14' } },
        { value: evalStats.not_achieved || 0, name: 'Chưa đạt', itemStyle: { color: '#ff4d4f' } },
      ].filter(d => d.value > 0),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  };
  const evalRef = useChart(evalStats.total_evaluations > 0 ? evalOption : null);

  // Monthly trend bar chart
  const sortedTrend = [...monthlyTrend].sort((a, b) => a.year - b.year || a.month - b.month);
  const trendOption = sortedTrend.length > 0 ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Tạo mới', 'Hoàn thành'], top: 0 },
    grid: { top: 30, bottom: 25, left: 40, right: 10 },
    xAxis: {
      type: 'category',
      data: sortedTrend.map(t => `T${t.month}/${t.year}`),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: 'Tạo mới', type: 'bar', data: sortedTrend.map(t => t.plans_created), itemStyle: { color: '#1890ff' } },
      { name: 'Hoàn thành', type: 'bar', data: sortedTrend.map(t => t.plans_completed), itemStyle: { color: '#52c41a' } },
    ],
  } : null;
  const trendRef = useChart(trendOption);

  // Top skills horizontal bar chart
  const skillsSorted = [...topSkills].sort((a, b) => a.success_rate - b.success_rate).slice(0, 8);
  const skillsOption = skillsSorted.length > 0 ? {
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}: ${p[0].value}%` },
    grid: { top: 5, bottom: 5, left: 10, right: 40, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: { type: 'category', data: skillsSorted.map(s => s.name.length > 20 ? s.name.slice(0, 20) + '…' : s.name), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: skillsSorted.map(s => ({
        value: s.success_rate,
        itemStyle: { color: s.success_rate >= 70 ? '#52c41a' : s.success_rate >= 40 ? '#faad14' : '#ff4d4f' },
      })),
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11 },
    }],
  } : null;
  const skillsRef = useChart(skillsOption);

  const childrenColumns = [
    { title: 'Tên trẻ', dataIndex: 'fullname', key: 'fullname' },
    {
      title: 'Ngày sinh', dataIndex: 'date_of_birth', key: 'date_of_birth',
      render: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '—',
    },
    { title: 'Lớp', dataIndex: 'class_name', key: 'class_name', render: (val) => val || '—' },
  ];

  const plansColumns = [
    { title: 'Tháng/Năm', key: 'period', render: (_, row) => `Tháng ${row.month}/${row.year}` },
    { title: 'Trẻ', dataIndex: 'child_name', key: 'child_name' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>,
    },
  ];

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Row 1: Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/children')}>
            <Statistic title="Tổng trẻ em" value={overview.total_children ?? 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/plans')}>
            <Statistic title="Tổng kế hoạch" value={overview.total_plans ?? 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Mục tiêu đã đánh giá"
              value={evalStats.total_evaluations ?? 0}
              suffix={`/ ${evalStats.total_goals ?? 0}`}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ đạt được"
              value={evalStats.total_evaluations ? Math.round((evalStats.achieved / evalStats.total_evaluations) * 100) : 0}
              suffix="%" prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Charts - Plan Status + Evaluation */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ trạng thái kế hoạch" loading={analyticsLoading}>
            {overview.total_plans > 0 ? (
              <div ref={planStatusRef} style={{ height: 260 }} />
            ) : (
              <Empty description="Chưa có kế hoạch" style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Kết quả đánh giá" loading={analyticsLoading}>
            {evalStats.total_evaluations > 0 ? (
              <div ref={evalRef} style={{ height: 260 }} />
            ) : (
              <Empty description="Chưa có đánh giá" style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Xu hướng kế hoạch (6 tháng)" loading={analyticsLoading}>
            {sortedTrend.length > 0 ? (
              <div ref={trendRef} style={{ height: 260 }} />
            ) : (
              <Empty description="Chưa có dữ liệu" style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Top Skills + Missing Plans */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ đạt theo mục tiêu" loading={analyticsLoading}>
            {skillsSorted.length > 0 ? (
              <div ref={skillsRef} style={{ height: 280 }} />
            ) : (
              <Empty description="Chưa có dữ liệu đánh giá" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />Trẻ chưa có kế hoạch tháng {currentMonth}/{currentYear}</>}
            loading={analyticsLoading}
          >
            {missingPlans.length > 0 ? (
              <List
                size="small"
                dataSource={missingPlans}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status="warning" />}
                      title={item.fullname}
                      description={`GV: ${item.teacher_name}`}
                    />
                    <Button size="small" type="link" onClick={() => navigate('/plans')}>Tạo KH</Button>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Tất cả trẻ đều có kế hoạch tháng này" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 4: Teacher Stats + Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Thống kê giáo viên" loading={analyticsLoading}>
            {topTeachers.length > 0 ? (
              <Table
                size="small"
                dataSource={topTeachers}
                rowKey="teacher_id"
                pagination={false}
                columns={[
                  { title: 'Giáo viên', dataIndex: 'name', key: 'name' },
                  { title: 'Số trẻ', dataIndex: 'children_count', key: 'children_count', width: 70, align: 'center' },
                  { title: 'KH tạo', dataIndex: 'plans_created', key: 'plans_created', width: 70, align: 'center' },
                  {
                    title: 'Tiến độ', key: 'progress', width: 140,
                    render: (_, row) => (
                      <Progress
                        size="small"
                        percent={row.plans_created ? Math.round((row.plans_completed / row.plans_created) * 100) : 0}
                        format={() => `${row.plans_completed}/${row.plans_created}`}
                      />
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="Chưa có giáo viên" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><ClockCircleOutlined style={{ marginRight: 8 }} />Hoạt động gần đây</>} loading={analyticsLoading}>
            {recentActivities.length > 0 ? (
              <List
                size="small"
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text>{item.user_name || 'Hệ thống'}</Text>}
                      description={
                        <Text type="secondary">
                          {ACTION_LABELS[item.action] || item.action}
                          {' — '}
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có hoạt động" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 5: Recent children + plans tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Danh sách trẻ gần đây">
            {children.length > 0 ? (
              <>
                <Table dataSource={children} columns={childrenColumns} pagination={false} rowKey="id" size="small" />
                <Button type="link" style={{ marginTop: 8 }} onClick={() => navigate('/children')}>Xem tất cả</Button>
              </>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Kế hoạch gần đây">
            {plans.length > 0 ? (
              <>
                <Table dataSource={plans} columns={plansColumns} pagination={false} rowKey="id" size="small" />
                <Button type="link" style={{ marginTop: 8 }} onClick={() => navigate('/plans')}>Xem tất cả</Button>
              </>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
