import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Breadcrumb, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  VideoCameraOutlined,
  TeamOutlined,
  DollarOutlined,
  GiftOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = AntLayout

type MenuItem = Required<MenuProps>['items'][number]

const menuConfig: MenuItem[] = [
  {
    key: '控制台',
    type: 'group',
    label: '控制台',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    ],
  },
  {
    key: '短剧管理',
    type: 'group',
    label: '短剧管理',
    children: [
      { key: '/dramas', icon: <VideoCameraOutlined />, label: '剧目管理' },
      { key: '/episodes', icon: <VideoCameraOutlined />, label: '剧集管理' },
    ],
  },
  {
    key: '会员管理',
    type: 'group',
    label: '会员管理',
    children: [
      { key: '/users', icon: <TeamOutlined />, label: '会员列表' },
      { key: '/money-logs', icon: <DollarOutlined />, label: '金币记录' },
      { key: '/watch-history', icon: <VideoCameraOutlined />, label: '观看历史' },
    ],
  },
  {
    key: '财务中心',
    type: 'group',
    label: '财务中心',
    children: [
      { key: '/recharge-plans', icon: <DollarOutlined />, label: '充值配置' },
      { key: '/recharge-records', icon: <DollarOutlined />, label: '充值记录' },
      {
        key: 'subscription-group',
        icon: <DollarOutlined />,
        label: '订阅管理',
        children: [
          { key: '/subscriptions', label: '订阅记录' },
          { key: '/subscription-plans', label: '订阅套餐' },
        ],
      },
    ],
  },
  {
    key: '兑换码管理',
    type: 'group',
    label: '兑换码管理',
    children: [
      { key: '/redeem-batches', icon: <GiftOutlined />, label: '兑换码批次' },
      { key: '/redeem-codes', icon: <GiftOutlined />, label: '兑换码列表' },
      { key: '/redeem-logs', icon: <GiftOutlined />, label: '兑换记录' },
    ],
  },
  {
    key: '常规管理',
    type: 'group',
    label: '常规管理',
    children: [
      { key: '/banners', icon: <SettingOutlined />, label: '轮播图管理' },
      { key: '/feedback', icon: <SettingOutlined />, label: '意见反馈' },
      { key: '/checkin-configs', icon: <SettingOutlined />, label: '签到配置' },
      { key: '/task-configs', icon: <SettingOutlined />, label: '任务配置' },
    ],
  },
]

const breadcrumbMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/dramas': '剧目管理',
  '/episodes': '剧集管理',
  '/users': '会员列表',
  '/money-logs': '金币记录',
  '/watch-history': '观看历史',
  '/recharge-plans': '充值配置',
  '/recharge-records': '充值记录',
  '/subscriptions': '订阅记录',
  '/subscription-plans': '订阅套餐',
  '/redeem-batches': '兑换码批次',
  '/redeem-codes': '兑换码列表',
  '/redeem-logs': '兑换记录',
  '/banners': '轮播图管理',
  '/feedback': '意见反馈',
  '/checkin-configs': '签到配置',
  '/task-configs': '任务配置',
}

const groupMap: Record<string, string> = {
  '/dashboard': '控制台',
  '/dramas': '短剧管理',
  '/episodes': '短剧管理',
  '/users': '会员管理',
  '/money-logs': '会员管理',
  '/watch-history': '会员管理',
  '/recharge-plans': '财务中心',
  '/recharge-records': '财务中心',
  '/subscriptions': '财务中心',
  '/subscription-plans': '财务中心',
  '/redeem-batches': '兑换码管理',
  '/redeem-codes': '兑换码管理',
  '/redeem-logs': '兑换码管理',
  '/banners': '常规管理',
  '/feedback': '常规管理',
  '/checkin-configs': '常规管理',
  '/task-configs': '常规管理',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const selectedKey = location.pathname
  const currentTitle = breadcrumbMap[selectedKey] || '管理后台'
  const currentGroup = groupMap[selectedKey] || ''

  const adminUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('admin_user')
      return raw ? JSON.parse(raw) : { username: 'Admin' }
    } catch {
      return { username: 'Admin' }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login', { replace: true })
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        theme="dark"
      >
        <div className="admin-logo">
          <span className="logo-dot" />
          {collapsed ? 'DM' : 'DramaMax'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['subscription-group']}
          items={menuConfig}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header className="admin-header" style={{ background: colorBgContainer }}>
          <Breadcrumb className="admin-breadcrumb" style={{ marginBottom: 0 }}>
            <Breadcrumb.Item>{currentGroup}</Breadcrumb.Item>
            <Breadcrumb.Item>{currentTitle}</Breadcrumb.Item>
          </Breadcrumb>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
              <span>{adminUser.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
