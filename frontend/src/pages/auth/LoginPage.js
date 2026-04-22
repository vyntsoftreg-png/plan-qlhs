import React, { useState } from 'react';
import { Form, Input, Button, Card, Checkbox, Typography, message, Spin } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/slices/authSlice';
import styles from './LoginPage.module.css';

const { Title, Text } = Typography;

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);

  const onFinish = async (values) => {
    try {
      const result = await dispatch(login({
        email: values.email,
        password: values.password,
      }));

      if (login.fulfilled.match(result)) {
        message.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (err) {
      message.error(error || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={2}>QLHS</Title>
          <Text type="secondary">Quản lý Giáo dục Mầm non</Text>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                Ghi nhớ tôi
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <div className={styles.footer}>
          <Text type="secondary">
            Liên hệ hỗ trợ nếu bạn quên mật khẩu
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
