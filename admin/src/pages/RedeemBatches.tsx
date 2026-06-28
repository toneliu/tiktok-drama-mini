import { Tag, Progress } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { redeemBatchApi } from '../api'
import { formatDate, formatDateShort, truncate } from '../utils'

export default function RedeemBatches() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '批次名称',
      dataIndex: 'batch_name',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '批次编号',
      dataIndex: 'batch_no',
      width: 160,
      render: (v: string) => truncate(v, 18),
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
      title: '生成数量',
      dataIndex: 'total_count',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '已使用',
      dataIndex: 'used_count',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: '未使用',
      key: 'unused',
      width: 80,
      render: (_: any, r: any) => (r.total_count ?? 0) - (r.used_count ?? 0),
    },
    {
      title: '使用率',
      key: 'rate',
      width: 140,
      render: (_: any, r: any) => {
        const total = r.total_count ?? 0
        const used = r.used_count ?? 0
        const percent = total > 0 ? Math.round((used / total) * 100) : 0
        return <Progress percent={percent} size="small" />
      },
    },
    {
      title: '有效期',
      key: 'valid',
      width: 200,
      render: (_: any, r: any) =>
        `${formatDateShort(r.valid_start_time)} ~ ${formatDateShort(r.valid_end_time)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: any) =>
        v === 1 || v === true ? <Tag color="green">有效</Tag> : <Tag>失效</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    { name: 'batch_name', label: '批次名称', type: 'text' as const, required: true, span: 24 },
    {
      name: 'type',
      label: '类型',
      type: 'select' as const,
      required: true,
      span: 12,
      options: [
        { label: '金币', value: 'coins' },
        { label: 'VIP', value: 'vip' },
      ],
    },
    { name: 'value', label: '价值', type: 'number' as const, required: true, min: 1, span: 12 },
    { name: 'total_count', label: '生成数量', type: 'number' as const, required: true, min: 1, span: 12 },
    { name: 'valid_start_time', label: '有效期开始', type: 'date' as const, span: 12 },
    { name: 'valid_end_time', label: '有效期结束', type: 'date' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="兑换码批次"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => redeemBatchApi.list(params)}
      createFn={(data) => redeemBatchApi.create(data)}
      deleteFn={(id) => redeemBatchApi.delete(id)}
      formFields={formFields}
      formWidth={640}
    />
  )
}
