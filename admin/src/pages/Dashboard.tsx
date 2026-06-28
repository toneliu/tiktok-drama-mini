import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, message, Spin } from 'antd'
import {
  TeamOutlined,
  CrownOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  UserAddOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api'

interface StatsData {
  total_users?: number
  vip_users?: number
  total_dramas?: number
  total_episodes?: number
  today_new_users?: number
  today_revenue?: number
  [key: string]: any
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await dashboardApi.stats()
        setStats(res?.data || res || {})
      } catch (e: any) {
        message.error(e.message || '加载统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    {
      title: '总用户数',
      value: stats.total_users ?? 0,
      icon: <TeamOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: 'VIP 用户',
      value: stats.vip_users ?? 0,
      icon: <CrownOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '剧目总数',
      value: stats.total_dramas ?? 0,
      icon: <VideoCameraOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '剧集总数',
      value: stats.total_episodes ?? 0,
      icon: <PlayCircleOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1',
    },
    {
      title: '今日新增用户',
      value: stats.today_new_users ?? 0,
      icon: <UserAddOutlined style={{ color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
    {
      title: '今日收入(元)',
      value: stats.today_revenue ?? 0,
      icon: <DollarOutlined style={{ color: '#13c2c2' }} />,
      color: '#13c2c2',
      precision: 2,
    },
  ]

  const vipRate =
    stats.total_users && stats.total_users > 0
      ? Math.round(((stats.vip_users ?? 0) / stats.total_users) * 100)
      : 0

  const dramaRatio =
    stats.total_dramas && stats.total_dramas > 0
      ? Math.round(((stats.total_episodes ?? 0) / (stats.total_dramas ?? 1)) * 10) / 10
      : 0

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={8} key={c.title}>
            <Card className="stat-card" bordered={false}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Statistic
                  title={c.title}
                  value={c.value}
                  precision={c.precision}
                />
                <span className="stat-icon">{c.icon}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="VIP 转化率" bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress
                type="circle"
                percent={vipRate}
                format={(p) => `${p}%`}
                strokeColor="#faad14"
              />
              <div style={{ color: '#666' }}>
                <p>总用户：{stats.total_users ?? 0}</p>
                <p>VIP 用户：{stats.vip_users ?? 0}</p>
                <p>VIP 转化率：{vipRate}%</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="剧目/剧集分布" bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress
                type="circle"
                percent={Math.min(dramaRatio * 10, 100)}
                format={() => `${dramaRatio}`}
                strokeColor="#722ed1"
              />
              <div style={{ color: '#666' }}>
                <p>剧目总数：{stats.total_dramas ?? 0}</p>
                <p>剧集总数：{stats.total_episodes ?? 0}</p>
                <p>平均每剧集数：{dramaRatio}</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
