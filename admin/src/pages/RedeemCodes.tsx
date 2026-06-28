import { useEffect, useState } from 'react'
import { Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { redeemCodeApi, redeemBatchApi } from '../api'
import { formatDate, formatDateShort, truncate } from '../utils'

export default function RedeemCodes() {
  const [batchOptions, setBatchOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res: any = await redeemBatchApi.list({ page: 1, page_size: 200 })
        const list = res?.list || res?.items || res?.data || []
        setBatchOptions(
          list.map((b: any) => ({
            label: b.batch_name || b.batch_no || b.id,
            value: b.id,
          }))
        )
      } catch {
        setBatchOptions([])
      }
    }
    loadBatches()
  }, [])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => truncate(v, 8),
    },
    {
      title: '兑换码',
      dataIndex: 'code',
      width: 160,
      render: (v: string) => v ? <span style={{ fontFamily: 'monospace' }}>{v}</span> : '-',
    },
    {
      title: '批次',
      dataIndex: 'batch_name',
      width: 140,
      render: (v: string) => v || '-',
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
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: any) => {
        const map: Record<string, { color: string; text: string }> = {
          unused: { color: 'green', text: '未使用' },
          used: { color: 'default', text: '已使用' },
          expired: { color: 'red', text: '已过期' },
        }
        const item = map[v]
        return item ? <Tag color={item.color}>{item.text}</Tag> : v || '-'
      },
    },
    {
      title: '使用用户',
      dataIndex: 'used_user_id',
      width: 100,
      render: (v: string) => (v ? truncate(v, 10) : '-'),
    },
    {
      title: '使用时间',
      dataIndex: 'used_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
    {
      title: '使用次数/限制',
      key: 'use_limit',
      width: 110,
      render: (_: any, r: any) => `${r.used_times ?? 0}/${r.max_times ?? 1}`,
    },
    {
      title: '有效期',
      key: 'valid',
      width: 200,
      render: (_: any, r: any) =>
        `${formatDateShort(r.valid_start_time)} ~ ${formatDateShort(r.valid_end_time)}`,
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
      title="兑换码"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => redeemCodeApi.list(params)}
      deleteFn={(id) => redeemCodeApi.delete(id)}
      searchFields={[
        {
          name: 'batch_id',
          label: '批次',
          type: 'select' as const,
          options: batchOptions,
          placeholder: '选择批次',
        },
        {
          name: 'status',
          label: '状态',
          type: 'select' as const,
          options: [
            { label: '未使用', value: 'unused' },
            { label: '已使用', value: 'used' },
            { label: '已过期', value: 'expired' },
          ],
        },
      ]}
      hideAdd
    />
  )
}
