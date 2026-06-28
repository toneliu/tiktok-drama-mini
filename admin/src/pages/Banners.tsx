import { Tag, Image } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { bannerApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function Banners() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '图片预览',
      dataIndex: 'img',
      width: 120,
      render: (v: string) =>
        v ? <Image width={80} height={45} src={v} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-',
    },
    {
      title: '链接',
      dataIndex: 'path',
      width: 180,
      render: (v: string) => truncate(v, 24),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
    {
      title: '页面类型',
      dataIndex: 'page_type',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '区域',
      dataIndex: 'area',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: any) =>
        v === 1 || v === true ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag color="default">禁用</Tag>
        ),
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
    { name: 'img', label: '图片地址', type: 'text' as const, span: 24 },
    { name: 'path', label: '跳转链接', type: 'text' as const, span: 24 },
    { name: 'type', label: '类型', type: 'text' as const, span: 12 },
    { name: 'area', label: '区域', type: 'text' as const, span: 12 },
    { name: 'page_type', label: '页面类型', type: 'text' as const, span: 12 },
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
      title="轮播图"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => bannerApi.list(params)}
      createFn={(data) => bannerApi.create(data)}
      updateFn={(id, data) => bannerApi.update(id, data)}
      deleteFn={(id) => bannerApi.delete(id)}
      formFields={formFields}
      formWidth={680}
    />
  )
}
