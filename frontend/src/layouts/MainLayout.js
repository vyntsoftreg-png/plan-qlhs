import React, { useState } from 'react';
import { Layout, Menu, Tooltip, Badge, Avatar, Dropdown, Button } from 'antd';
import { useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  StarOutlined,
  CheckSquareOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { toggleSidebar } from '../redux/slices/uiSlice';
import styles from './MainLayout.module.css';

const { Sider, Content, Header } = Layout;

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const userMenu = [
    {
      label: 'Hồ sơ',
      key: 'profile',
      icon: <UserOutlined />,
    },
    {
      label: 'Cài đặt',
      key: 'settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      label: 'Đăng xuất',
      key: 'logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const sidebarMenu = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/children',
      icon: <TeamOutlined />,
      label: 'Trẻ em',
      onClick: () => navigate('/children'),
    },
    {
      key: '/plans',
      icon: <FileTextOutlined />,
      label: 'Kế hoạch',
      onClick: () => navigate('/plans'),
    },
    {
      key: '/evaluations',
      icon: <CheckSquareOutlined />,
      label: 'Đánh giá',
      onClick: () => navigate('/evaluations'),
    },
    {
      key: '/skills',
      icon: <StarOutlined />,
      label: 'Kỹ năng',
      onClick: () => navigate('/skills'),
    },
    {
      key: '/templates',
      icon: <CopyOutlined />,
      label: 'Mẫu kế hoạch',
      onClick: () => navigate('/templates'),
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
      onClick: () => navigate('/users'),
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Thống kê',
      onClick: () => navigate('/analytics'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt trường',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={sidebarCollapsed}
        theme="light"
        className={styles.sidebar}
        width={250}
      >
        <div className={styles.logo}>
          <h1>QLHS</h1>
        </div>
        <Menu
          mode="inline"
          items={sidebarMenu}
          selectedKeys={[location.pathname]}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
            />
          </div>

          <div className={styles.headerRight}>
            <Tooltip title="Thông báo">
              <Badge count={0} style={{ backgroundColor: '#ff4d4f' }}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={{ items: userMenu }}>
              <Avatar style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
