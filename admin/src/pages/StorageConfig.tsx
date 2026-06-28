import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Radio, message, Space, Tag, Alert, Divider } from 'antd'
import { storageConfigApi } from '../api'

type StorageType = 'local' | 'oss' | 'tos' | 'qiniu'

interface StorageConfigData {
  storage_type: StorageType
  oss_provider: string
  oss_endpoint: string
  oss_access_key: string
  oss_secret_key: string
  oss_secret_set?: boolean
  oss_bucket: string
  oss_domain: string
  oss_status: 'normal' | 'hidden'
}

// 各云厂商的字段提示配置
const providerMeta: Record<
  Exclude<StorageType, 'local'>,
  {
    label: string
    tag: string
    tagColor: string
    endpointLabel: string
    endpointPlaceholder: string
    endpointExtra: string
    domainExtra: string
    domainRequired?: boolean
  }
> = {
  oss: {
    label: '阿里云 OSS',
    tag: 'CDN 加速',
    tagColor: 'blue',
    endpointLabel: 'Endpoint',
    endpointPlaceholder: 'oss-cn-hangzhou.aliyuncs.com',
    endpointExtra: '如 oss-cn-hangzhou.aliyuncs.com，不带 https://',
    domainExtra: 'CDN 或 OSS 绑定域名，如 https://cdn.example.com，留空则用 https://bucket.endpoint',
  },
  tos: {
    label: '火山引擎 TOS',
    tag: 'CDN 加速',
    tagColor: 'purple',
    endpointLabel: 'Endpoint',
    endpointPlaceholder: 'tos-cn-beijing.volces.com',
    endpointExtra: '如 tos-cn-beijing.volces.com，不带 https://。region 将自动从 endpoint 推导（tos-cn-beijing → cn-beijing）',
    domainExtra: 'CDN 或 TOS 绑定域名，如 https://cdn.example.com，留空则用 https://bucket.endpoint',
  },
  qiniu: {
    label: '七牛云 Kodo',
    tag: 'CDN 加速',
    tagColor: 'green',
    endpointLabel: '上传域名（可选）',
    endpointPlaceholder: 'https://upload.qiniup.com',
    endpointExtra: '留空默认 https://upload.qiniup.com，华东 z1 用 https://upload-z1.qiniup.com',
    domainExtra: '必填。七牛要求绑定域名访问文件，如 https://cdn.example.com',
    domainRequired: true,
  },
}

export default function StorageConfigPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [secretSet, setSecretSet] = useState(false)
  const [storageType, setStorageType] = useState<StorageType>('local')

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await storageConfigApi.get()
      const data = res || {}
      setSecretSet(!!data.oss_secret_set)
      setStorageType(data.storage_type || 'local')
      form.setFieldsValue({
        storage_type: data.storage_type || 'local',
        oss_provider: data.oss_provider || 'aliyun',
        oss_endpoint: data.oss_endpoint || '',
        oss_access_key: data.oss_access_key || '',
        oss_secret_key: '',
        oss_bucket: data.oss_bucket || '',
        oss_domain: data.oss_domain || '',
        oss_status: data.oss_status || 'hidden',
      })
    } catch (e: any) {
      message.error(e.message || '加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload: any = { ...values }
      if (!payload.oss_secret_key) {
        delete payload.oss_secret_key
      }
      await storageConfigApi.update(payload)
      message.success('保存成功')
      load()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const meta = storageType === 'local' ? null : providerMeta[storageType]

  return (
    <div>
      <Card
        title="存储配置"
        loading={loading}
        extra={
          <Space>
            <Button onClick={load}>刷新</Button>
            <Button type="primary" loading={saving} onClick={onSave}>
              保存配置
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 680 }}>
          <Form.Item
            name="storage_type"
            label="存储后端"
            tooltip="选择云存储后，图片和视频将上传到对应云服务；选择本地则存储在服务器 ./data/uploads 目录。配置不完整或未启用时自动本地兜底。"
          >
            <Radio.Group
              onChange={(e) => setStorageType(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="local">
                本地存储{' '}
                <Tag color="default" style={{ marginLeft: 4 }}>
                  兜底
                </Tag>
              </Radio.Button>
              <Radio.Button value="oss">阿里云 OSS</Radio.Button>
              <Radio.Button value="tos">火山引擎 TOS</Radio.Button>
              <Radio.Button value="qiniu">七牛云 Kodo</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {meta && (
            <>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`${meta.label} 已选择`}
                description={`启用后新上传的图片/视频将存入${meta.label}。访问域名优先使用下方配置的 CDN 域名。本地存储仍作为兜底（配置不完整或停用时自动切换）。`}
              />
              <Divider orientation="left">{meta.label} 凭证</Divider>
              <Form.Item name="oss_provider" hidden initialValue="aliyun">
                <Input />
              </Form.Item>
              <Form.Item
                name="oss_endpoint"
                label={meta.endpointLabel}
                rules={[{ required: storageType !== 'qiniu', message: `请输入${meta.endpointLabel}` }]}
                extra={meta.endpointExtra}
              >
                <Input placeholder={meta.endpointPlaceholder} />
              </Form.Item>
              <Form.Item
                name="oss_bucket"
                label="Bucket / 空间名"
                rules={[{ required: true, message: '请输入 Bucket / 空间名' }]}
              >
                <Input placeholder="my-drama-bucket" />
              </Form.Item>
              <Form.Item
                name="oss_access_key"
                label="AccessKey ID"
                rules={[{ required: true, message: '请输入 AccessKey ID' }]}
              >
                <Input placeholder="AK..." />
              </Form.Item>
              <Form.Item
                name="oss_secret_key"
                label="AccessKey Secret"
                extra={
                  secretSet ? (
                    <span style={{ color: '#52c41a' }}>已设置（留空表示不修改）</span>
                  ) : (
                    <span style={{ color: '#faad14' }}>未设置</span>
                  )
                }
              >
                <Input.Password placeholder={secretSet ? '已设置，留空不修改' : '请输入 AccessKey Secret'} />
              </Form.Item>
              <Form.Item
                name="oss_domain"
                label="访问域名（CDN）"
                rules={[{ required: meta.domainRequired, message: '七牛必须配置访问域名' }]}
                extra={meta.domainExtra}
              >
                <Input placeholder="https://cdn.example.com" />
              </Form.Item>
              <Form.Item name="oss_status" label="启用状态">
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value="normal">启用</Radio.Button>
                  <Radio.Button value="hidden">停用</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          {storageType === 'local' && (
            <Alert
              type="warning"
              showIcon
              message="当前使用本地存储"
              description="图片和视频存储在服务器 ./data/uploads 目录，通过 /uploads 路径访问。适合小流量场景，大视频建议启用云存储 + CDN。"
            />
          )}
        </Form>
      </Card>
    </div>
  )
}
