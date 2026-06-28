import { Avatar, Image, Tag } from 'antd'
import CRUDPage from '../components/CRUDPage'
import { userApi } from '../api'
import { formatDate, truncate } from '../utils'

export default function Users() {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
      render: (v: string) => truncate(v, 10),
    },
    {
      title: '头像',
      dataIndex: 'avatar_url',
      width: 70,
      render: (v: string) =>
        v ? <Image width={40} height={40} src={v} style={{ objectFit: 'cover', borderRadius: '50%' }} /> : <Avatar />,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: 'OpenID',
      dataIndex: 'open_id',
      width: 180,
      render: (v: string) => truncate(v, 20),
    },
    {
      title: '是否VIP',
      dataIndex: 'is_vip',
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="gold">VIP</Tag> : <Tag>普通</Tag>,
    },
    {
      title: 'VIP到期时间',
      dataIndex: 'vip_expire_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
    {
      title: '国家',
      dataIndex: 'country',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v: any) => formatDate(v),
    },
  ]

  const formFields = [
    { name: 'is_vip', label: '是否VIP', type: 'switch' as const, span: 12 },
    { name: 'vip_expire_at', label: 'VIP到期时间', type: 'date' as const, span: 12 },
  ]

  return (
    <CRUDPage
      title="会员"
      rowKey="id"
      columns={columns}
      fetchFn={(params) => userApi.list(params)}
      updateFn={(id, data) => userApi.setVip(id, data)}
      searchFields={[{ name: 'keyword', label: '昵称/OpenID' }]}
      formFields={formFields}
      formWidth={520}
      hideAdd
      createText="设置VIP"
    />
  )
}
