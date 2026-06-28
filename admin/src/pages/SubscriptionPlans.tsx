import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { subscriptionPlanApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function SubscriptionPlans() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 90,
      render: (v: number) => `¥${(v ?? 0).toFixed(2)}`,
    },
    {
      title: '金豆',
      dataIndex: 'beans',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '时长(天)',
      dataIndex: 'duration',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: '是否推荐',
      dataIndex: 'is_popular',
      width: 100,
      render: (v: any) =>
        v ? <Tag color="volcano">推荐</Tag> : <Tag>否</Tag>,
    },
    {
      title: '折扣',
      dataIndex: 'discount',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 90,
      render: (v: any) =>
        v === 1 || v === true ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    { name: 'name', label: '名称', type: 'text' as const, required: true, span: 12 },
    { name: 'duration', label: '时长(天)', type: 'number' as const, required: true, min: 1, span: 12 },
    { name: 'price', label: '价格', type: 'number' as const, required: true, min: 0, step: 0.01, span: 12 },
    { name: 'beans', label: '金豆', type: 'number' as const, min: 0, span: 12 },
    { name: 'discount', label: '折扣', type: 'text' as const, span: 12 },
    { name: 'is_popular', label: '是否推荐', type: 'switch' as const, span: 12 },
    { name: 'is_active', label: '是否启用', type: 'switch' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="订阅套餐"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => subscriptionPlanApi.list(params)}
      createFn={(data) => subscriptionPlanApi.create(data)}
      updateFn={(id, data) => subscriptionPlanApi.update(id, data)}
      deleteFn={(id) => subscriptionPlanApi.delete(id)}
      formFields={formFields}
      formWidth={640}
    />
  )
}
