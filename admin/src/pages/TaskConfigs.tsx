import { Tag, Image } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { taskConfigApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function TaskConfigs() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '图片',
      dataIndex: 'image',
      width: 80,
      render: (v: string) =>
        v ? <Image width={40} height={40} src={v} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
    {
      title: '任务Key',
      dataIndex: 'task_key',
      width: 140,
      render: (v: string) => v || '-',
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
      title: '奖励数量',
      dataIndex: 'reward_amount',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '最大次数',
      dataIndex: 'max_times',
      width: 90,
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
      title: '操作链接',
      dataIndex: 'op_link',
      width: 160,
      render: (v: string) => truncate(v, 20),
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
    { name: 'title', label: '标题', type: 'text' as const, required: true, span: 12 },
    { name: 'weigh', label: '排序', type: 'number' as const, min: 0, span: 12 },
    { name: 'image', label: '图片地址', type: 'text' as const, span: 24 },
    { name: 'type', label: '类型', type: 'text' as const, span: 12 },
    { name: 'task_key', label: '任务Key', type: 'text' as const, span: 12 },
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
    { name: 'reward_amount', label: '奖励数量', type: 'number' as const, min: 0, span: 12 },
    { name: 'max_times', label: '最大次数', type: 'number' as const, min: 0, span: 12 },
    { name: 'op_link', label: '操作链接', type: 'text' as const, span: 12 },
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
  ]

  return (
    <CRUDPage
      title="任务配置"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => taskConfigApi.list(params)}
      createFn={(data) => taskConfigApi.create(data)}
      updateFn={(id, data) => taskConfigApi.update(id, data)}
      deleteFn={(id) => taskConfigApi.delete(id)}
      formFields={formFields}
      formWidth={680}
    />
  )
}
