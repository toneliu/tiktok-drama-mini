import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { subscriptionApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function Subscriptions() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 100,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '套餐ID',
      dataIndex: 'plan_id',
      width: 100,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '订单号',
      dataIndex: 'order_id',
      width: 180,
      render: (v: string) => truncate(v, 22),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '有效' },
          expired: { color: 'default', text: '已过期' },
          cancelled: { color: 'red', text: '已取消' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
    {
      title: '到期时间',
      dataIndex: 'expired_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  return (
    <CRUDPage
      title="订阅记录"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => subscriptionApi.list(params)}
      searchFields={[{ name: 'keyword', label: '订单号/用户ID' }]}
      hideAdd
    />
  )
}
