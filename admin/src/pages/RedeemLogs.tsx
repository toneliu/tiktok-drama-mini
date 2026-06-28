import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { redeemLogApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function RedeemLogs() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '兑换码',
      dataIndex: 'code',
      width: 150,
      render: (v: string) => (v ? <span style={{ fontFamily: 'monospace' }}>{v}</span> : '-'),
    },
    {
      title: '批次',
      dataIndex: 'batch_name',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      width: 100,
      render: (v: string) => (v ? truncate(v, 10) : '-'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          coins: { color: 'orange', text: '金币' },
          vip: { color: 'gold', text: 'VIP' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '价值',
      dataIndex: 'value',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: '金币',
      dataIndex: 'coins',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'VIP天数',
      dataIndex: 'vip_days',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '兑换前余额',
      dataIndex: 'before_balance',
      width: 110,
      render: (v: number) => v ?? 0,
    },
    {
      title: '兑换后余额',
      dataIndex: 'after_balance',
      width: 110,
      render: (v: number) => v ?? 0,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '设备',
      dataIndex: 'device',
      width: 130,
      render: (v: string) => truncate(v, 14),
    },
    {
      title: '兑换时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  return (
    <CRUDPage
      title="兑换记录"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => redeemLogApi.list(params)}
      searchFields={[{ name: 'keyword', label: '兑换码/用户' }]}
      hideAdd
    />
  )
}
