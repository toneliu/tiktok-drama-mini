import { Tag, Image } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { dramaApi } from '../api'
import { formatDate, formatNumber, truncate } from '../utils'

export default function Dramas() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '封面',
      dataIndex: 'cover',
      width: 80,
      render: (v: string) =>
        v ? <Image width={50} height={66} src={v} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
    },
    {
      title: '总集数',
      dataIndex: 'total_episodes',
      width: 90,
      render: (v: number) => v ?? 0,
    },
    {
      title: '播放量',
      dataIndex: 'view_count',
      width: 110,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      width: 80,
      render: (v: number) => (v ?? 0).toFixed(1),
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, r: any) => (
        <>
          {r.is_hot && <Tag color="red">热门</Tag>}
          {r.is_new && <Tag color="green">新剧</Tag>}
          {!r.is_hot && !r.is_new && <span style={{ color: '#999' }}>-</span>}
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    { name: 'title', label: '标题', type: 'text' as const, required: true, span: 24 },
    { name: 'cover', label: '封面图', type: 'image' as const, span: 24 },
    { name: 'category', label: '分类', type: 'text' as const, span: 12 },
    { name: 'total_episodes', label: '总集数', type: 'number' as const, min: 0, span: 12 },
    { name: 'rating', label: '评分', type: 'number' as const, min: 0, max: 10, step: 0.1, span: 12 },
    { name: 'is_hot', label: '是否热门', type: 'switch' as const, span: 12 },
    { name: 'is_new', label: '是否新剧', type: 'switch' as const, span: 12 },
    { name: 'description', label: '描述', type: 'textarea' as const, span: 24, rows: 3 },
  ]

  return (
    <CRUDPage
      title="剧目"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => dramaApi.list(params)}
      createFn={(data) => dramaApi.create(data)}
      updateFn={(id, data) => dramaApi.update(id, data)}
      deleteFn={(id) => dramaApi.delete(id)}
      searchFields={[{ name: 'keyword', label: '标题' }]}
      formFields={formFields}
      formWidth={680}
    />
  )
}
