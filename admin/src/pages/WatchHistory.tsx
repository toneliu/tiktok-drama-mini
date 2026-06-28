import { Tag, Progress } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { watchHistoryApi } from '../api'
import { formatDate, formatDuration, truncate } from '../utils'

export default function WatchHistory() {
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
      title: '剧目',
      dataIndex: 'drama_title',
      width: 150,
      render: (v: string) => v || truncate(v, 16),
    },
    {
      title: '集数',
      dataIndex: 'episode_number',
      width: 80,
      render: (v: number) => (v ? `第${v}集` : '-'),
    },
    {
      title: '进度',
      key: 'progress',
      width: 160,
      render: (_: any, r: any) => {
        const progress = r.progress ?? 0
        const duration = r.duration ?? 0
        const percent = duration > 0 ? Math.min(Math.round((progress / duration) * 100), 100) : 0
        return (
          <div>
            <Progress percent={percent} size="small" />
            <span style={{ fontSize: 12, color: '#999' }}>
              {formatDuration(progress)} / {formatDuration(duration)}
            </span>
          </div>
        )
      },
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 90,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '是否完成',
      dataIndex: 'is_completed',
      width: 100,
      render: (v: any) =>
        v ? <Tag color="green">已完成</Tag> : <Tag>未完成</Tag>,
    },
    {
      title: '观看时间',
      dataIndex: 'watched_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  return (
    <CRUDPage
      title="观看历史"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => watchHistoryApi.list(params)}
      searchFields={[{ name: 'user_id', label: '用户ID' }]}
      hideAdd
    />
  )
}
