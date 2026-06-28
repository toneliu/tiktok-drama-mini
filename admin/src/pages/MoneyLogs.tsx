import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { moneyLogApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function MoneyLogs() {
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
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 100,
      render: (v: number) => {
        const num = v ?? 0
        return (
          <span style={{ color: num >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {num >= 0 ? '+' : ''}
            {num}
          </span>
        )
      },
    },
    {
      title: '变更前',
      dataIndex: 'before_balance',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: '变更后',
      dataIndex: 'after_balance',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (v: string) => (
        <div style={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {v || '-'}
        </div>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  return (
    <CRUDPage
      title="金币记录"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => moneyLogApi.list(params)}
      searchFields={[{ name: 'user_id', label: '用户ID' }]}
      hideAdd
    />
  )
}
