import { useEffect, useState } from 'react'
import { Tag, Image } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { episodeApi, dramaApi } from '../api'
import { formatDate, formatDuration, formatNumber, truncate } from '../utils'

export default function Episodes() {
  const [dramaOptions, setDramaOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    const loadDramas = async () => {
      try {
        const res: any = await dramaApi.all()
        const list = res?.list || res?.items || res?.data || []
        setDramaOptions(
          list.map((d: any) => ({ label: d.title || d.id, value: d.id }))
        )
      } catch {
        setDramaOptions([])
      }
    }
    loadDramas()
  }, [])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '缩略图',
      dataIndex: 'thumbnail',
      width: 80,
      render: (v: string) =>
        v ? <Image width={50} height={66} src={v} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-',
    },
    {
      title: '集数',
      dataIndex: 'episode_number',
      width: 70,
      render: (v: number) => v ?? 0,
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 90,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '播放源',
      dataIndex: 'play_source',
      width: 90,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          cdn: { color: 'blue', text: 'CDN' },
          tiktok: { color: 'purple', text: 'TikTok' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '是否免费',
      dataIndex: 'is_free',
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="green">免费</Tag> : <Tag color="orange">付费</Tag>,
    },
    {
      title: '播放量',
      dataIndex: 'view_count',
      width: 100,
      render: (v: number) => formatNumber(v),
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
      name: 'drama_id',
      label: '所属剧目',
      type: 'select' as const,
      required: true,
      span: 24,
      options: dramaOptions,
    },
    { name: 'episode_number', label: '集数', type: 'number' as const, required: true, min: 1, span: 12 },
    { name: 'title', label: '标题', type: 'text' as const, span: 12 },
    { name: 'thumbnail', label: '缩略图', type: 'image' as const, span: 24 },
    { name: 'duration', label: '时长(秒)', type: 'number' as const, min: 0, span: 12 },
    {
      name: 'play_source',
      label: '播放源',
      type: 'select' as const,
      span: 12,
      options: [
        { label: 'CDN', value: 'cdn' },
        { label: 'TikTok', value: 'tiktok' },
      ],
    },
    { name: 'play_url', label: '视频文件', type: 'video' as const, span: 24 },
    { name: 'tiktok_video_id', label: 'TikTok视频ID', type: 'text' as const, span: 12 },
    { name: 'is_free', label: '是否免费', type: 'switch' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="剧集"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => episodeApi.list(params)}
      createFn={(data) => episodeApi.create(data)}
      updateFn={(id, data) => episodeApi.update(id, data)}
      deleteFn={(id) => episodeApi.delete(id)}
      searchFields={[
        {
          name: 'drama_id',
          label: '剧目',
          type: 'select' as const,
          options: dramaOptions,
          placeholder: '选择剧目',
        },
      ]}
      formFields={formFields}
      formWidth={680}
    />
  )
}
