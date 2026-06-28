import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { rechargeRecordApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function RechargeRecords() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '订单号',
      dataIndex: 'order_id',
      width: 180,
      render: (v: string) => truncate(v, 22),
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 100,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          paid: { color: 'green', text: '已支付' },
          pending: { color: 'orange', text: '待支付' },
          failed: { color: 'red', text: '失败' },
          refunded: { color: 'default', text: '已退款' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 90,
      render: (v: number) => (v ?? 0).toFixed(2),
    },
    {
      title: '赠送',
      dataIndex: 'bonus',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '交易号',
      dataIndex: 'trade_order_id',
      width: 180,
      render: (v: string) => truncate(v, 22),
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
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
      title="充值记录"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => rechargeRecordApi.list(params)}
      searchFields={[{ name: 'keyword', label: '订单号/用户ID' }]}
      hideAdd
    />
  )
}
