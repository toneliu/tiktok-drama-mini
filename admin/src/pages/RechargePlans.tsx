import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { rechargePlanApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function RechargePlans() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '类型',
      dataIndex: 'recharge_type',
      width: 90,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          vip: { color: 'gold', text: 'VIP' },
          coins: { color: 'orange', text: '金币' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '原价',
      dataIndex: 'original_price',
      width: 90,
      render: (v: number) => (v ?? 0).toFixed(2),
    },
    {
      title: '现价',
      dataIndex: 'current_price',
      width: 90,
      render: (v: number) => (v ?? 0).toFixed(2),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '赠送金币',
      dataIndex: 'bonus_gold',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: any) =>
        v === 1 || v === true ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>,
    },
    {
      title: 'Google ID',
      dataIndex: 'google_id',
      width: 160,
      render: (v: string) => truncate(v, 18),
    },
    {
      title: 'iOS ID',
      dataIndex: 'ios_id',
      width: 160,
      render: (v: string) => truncate(v, 18),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    {
      name: 'recharge_type',
      label: '充值类型',
      type: 'select' as const,
      required: true,
      span: 12,
      options: [
        { label: 'VIP', value: 'vip' },
        { label: '金币', value: 'coins' },
      ],
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      span: 12,
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
    { name: 'original_price', label: '原价', type: 'number' as const, min: 0, step: 0.01, span: 12 },
    { name: 'current_price', label: '现价', type: 'number' as const, min: 0, step: 0.01, span: 12 },
    { name: 'amount', label: '金额(金豆)', type: 'number' as const, min: 0, span: 12 },
    { name: 'bonus_gold', label: '赠送金币', type: 'number' as const, min: 0, span: 12 },
    { name: 'google_id', label: 'Google商品ID', type: 'text' as const, span: 12 },
    { name: 'ios_id', label: 'iOS商品ID', type: 'text' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="充值配置"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => rechargePlanApi.list(params)}
      createFn={(data) => rechargePlanApi.create(data)}
      updateFn={(id, data) => rechargePlanApi.update(id, data)}
      deleteFn={(id) => rechargePlanApi.delete(id)}
      formFields={formFields}
      formWidth={680}
    />
  )
}
