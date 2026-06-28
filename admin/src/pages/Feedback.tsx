import CRUDPage from '../components/CRUDPage'
import { feedbackApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function Feedback() {
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
      title: '联系方式',
      dataIndex: 'contact',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      render: (v: string) => (
        <div style={{ maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {v || '-'}
        </div>
      ),
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
      title="反馈"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => feedbackApi.list(params)}
      deleteFn={(id) => feedbackApi.delete(id)}
      searchFields={[{ name: 'keyword', label: '内容' }]}
      hideAdd
    />
  )
}
