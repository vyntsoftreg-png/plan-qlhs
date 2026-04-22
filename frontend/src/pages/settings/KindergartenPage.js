import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Card, Tabs, message, Spin, Statistic, Row, Col,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchKindergartenProfile, updateKindergartenProfile,
  getKindergartenSettings,
} from '../../redux/slices/kindergartenSlice';
import { checkAuth } from '../../redux/slices/authSlice';

export default function KindergartenPage() {
  const dispatch = useDispatch();
  const { profile, settings, loading } = useSelector(state => state.kindergarten);
  const { user } = useSelector(state => state.auth);

  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchKindergartenProfile());
    dispatch(getKindergartenSettings());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
        principal_name: profile.principal_name,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      await dispatch(updateKindergartenProfile(values)).unwrap();
      message.success('Lưu thông tin trường thành công');
      // Re-fetch auth to update kindergarten_id in token context
      await dispatch(checkAuth());
      dispatch(fetchKindergartenProfile());
    } catch (err) {
      if (err?.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statsColumns = [
    { title: 'Chỉ số', dataIndex: 'label', key: 'label' },
    { title: 'Giá trị', dataIndex: 'value', key: 'value' },
  ];

  const statsData = settings ? [
    { key: 'children', label: 'Tổng trẻ em', value: settings.total_children ?? '—' },
    { key: 'teachers', label: 'Giáo viên', value: settings.total_teachers ?? '—' },
    { key: 'plans', label: 'Kế hoạch đang hoạt động', value: settings.active_plans ?? '—' },
    { key: 'skills', label: 'Tổng kỹ năng', value: settings.total_skills ?? '—' },
    { key: 'templates', label: 'Mẫu kế hoạch', value: settings.total_templates ?? '—' },
  ] : [];

  const tabItems = [
    {
      key: 'profile',
      label: 'Thông tin trường',
      children: loading ? <Spin /> : (
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item name="name" label="Tên trường" rules={[{ required: true, message: 'Nhập tên trường' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="principal_name" label="Hiệu trưởng">
            <Input disabled />
          </Form.Item>
          {(user?.role === 'admin' || user?.role === 'principal') && (
            <Form.Item>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          )}
        </Form>
      ),
    },
    {
      key: 'stats',
      label: 'Thống kê tổng quan',
      children: loading ? <Spin /> : (
        <div>
          <Row gutter={[16, 16]}>
            {statsData.map(item => (
              <Col key={item.key} xs={12} sm={8} md={6}>
                <Card>
                  <Statistic title={item.label} value={item.value} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title="Cài đặt trường học">
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
