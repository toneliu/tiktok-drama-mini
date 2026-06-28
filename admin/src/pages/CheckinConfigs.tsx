import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { checkinConfigApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function CheckinConfigs() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '天数',
      dataIndex: 'day',
      width: 80,
      render: (v: number) => `第${v ?? 0}天`,
    },
    {
      title: '奖励数量',
      dataIndex: 'reward_amount',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '奖励类型',
      dataIndex: 'reward_type',
      width: 100,
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
      title: '描述',
      dataIndex: 'reward_desc',
      width: 200,
      render: (v: string) => v || '-',
    },
    {
      title: '启用',
      dataIndex: 'is_enabled',
      width: 80,
      render: (v: any) =>
        v === 1 || v === true ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '排序',
      dataIndex: 'weigh',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    { name: 'day', label: '天数', type: 'number' as const, required: true, min: 1, span: 12 },
    { name: 'weigh', label: '排序', type: 'number' as const, min: 0, span: 12 },
    { name: 'reward_amount', label: '奖励数量', type: 'number' as const, required: true, min: 0, span: 12 },
    {
      name: 'reward_type',
      label: '奖励类型',
      type: 'select' as const,
      span: 12,
      options: [
        { label: '金币', value: 'coins' },
        { label: 'VIP', value: 'vip' },
      ],
    },
    { name: 'reward_desc', label: '描述', type: 'text' as const, span: 24 },
    { name: 'is_enabled', label: '启用', type: 'switch' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="签到配置"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => checkinConfigApi.list(params)}
      createFn={(data) => checkinConfigApi.create(data)}
      updateFn={(id, data) => checkinConfigApi.update(id, data)}
      deleteFn={(id) => checkinConfigApi.delete(id)}
      formFields={formFields}
      formWidth={640}
    />
  )
}
