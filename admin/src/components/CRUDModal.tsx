import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Select, DatePicker, Upload, message, Button, Space, Tag } from 'antd'
import { PlusOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons'
import type { FieldConfig } from './types'
import type { UploadFile, UploadProps } from 'antd'
import dayjs from 'dayjs'
import { uploadApi } from '../api'

const { TextArea } = Input

interface CRUDModalProps {
  open: boolean
  title: string
  width?: number
  fields: FieldConfig[]
  initialValues?: Record<string, any>
  loading?: boolean
  onOk: (values: any) => void
  onCancel: () => void
}

export default function CRUDModal({
  open,
  title,
  width = 640,
  fields,
  initialValues,
  loading = false,
  onOk,
  onCancel,
}: CRUDModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      const values: Record<string, any> = { ...initialValues }
      fields.forEach((f) => {
        if (f.type === 'date' && values[f.name]) {
          values[f.name] = dayjs(values[f.name])
        }
      })
      form.setFieldsValue(values)
    } else {
      form.resetFields()
    }
  }, [open, initialValues, form, fields])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload: Record<string, any> = { ...values }
      fields.forEach((f) => {
        if (f.type === 'date' && values[f.name]) {
          payload[f.name] = dayjs(values[f.name]).format('YYYY-MM-DD HH:mm:ss')
        }
      })
      onOk(payload)
    } catch {
      // validation error, keep modal open
    }
  }

  const renderField = (field: FieldConfig) => {
    const span = field.span ?? 24
    const colStyle = { gridColumn: `span ${span}` }

    let control: React.ReactNode = null
    switch (field.type) {
      case 'textarea':
        control = (
          <TextArea
            rows={field.rows ?? 4}
            placeholder={field.placeholder || `请输入${field.label}`}
            maxLength={field.maxLength}
          />
        )
        break
      case 'number':
        control = (
          <InputNumber
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            placeholder={field.placeholder || `请输入${field.label}`}
          />
        )
        break
      case 'switch':
        control = <Switch checkedChildren="开" unCheckedChildren="关" />
        break
      case 'select':
        control = (
          <Select
            placeholder={field.placeholder || `请选择${field.label}`}
            options={field.options}
            allowClear
          />
        )
        break
      case 'date':
        control = (
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder={field.placeholder || `请选择${field.label}`}
          />
        )
        break
      case 'password':
        control = (
          <Input.Password placeholder={field.placeholder || `请输入${field.label}`} />
        )
        break
      case 'image':
        control = <ImageUploadField />
        break
      case 'video':
        control = (
          <VideoUploadField
            linkSourceField={field.linkSourceField}
            allowManualUrl={field.allowManualUrl !== false}
          />
        )
        break
      default:
        control = (
          <Input placeholder={field.placeholder || `请输入${field.label}`} />
        )
    }

    return (
      <Form.Item
        key={field.name}
        name={field.name}
        label={field.label}
        valuePropName={field.type === 'switch' ? 'checked' : 'value'}
        rules={field.required ? [{ required: true, message: `请填写${field.label}` }] : []}
        style={colStyle}
      >
        {control}
      </Form.Item>
    )
  }

  return (
    <Modal
      title={title}
      open={open}
      width={width}
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(24, 1fr)',
            gap: '0 16px',
          }}
        >
          {fields.map(renderField)}
        </div>
      </Form>
    </Modal>
  )
}

// ImageUploadField 图片上传字段，Form value 为图片 URL 字符串
function ImageUploadField({ value, onChange }: { value?: string; onChange?: (v?: string) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const fileList: UploadFile[] = value
    ? [
        {
          uid: '-1',
          name: value.split('/').pop() || 'image',
          status: 'done',
          url: value,
        } as UploadFile,
      ]
    : []

  const uploadProps: UploadProps = {
    listType: 'picture-card',
    fileList,
    maxCount: 1,
    accept: 'image/*',
    onPreview: () => setPreviewOpen(true),
    onRemove: () => {
      onChange?.(undefined)
      return true
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options
      try {
        const res: any = await uploadApi.image(file as File)
        const url = res?.url || res?.path
        if (!url) throw new Error('上传返回数据异常')
        onChange?.(url)
        onSuccess?.({}, file)
        message.success('上传成功')
      } catch (e: any) {
        onError?.(e)
        message.error(e.message || '上传失败')
      }
    },
  }

  return (
    <>
      <Upload {...uploadProps}>
        {!value && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传图片</div>
          </div>
        )}
      </Upload>
      {previewOpen && value && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <img src={value} alt="preview" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
      )}
    </>
  )
}

// 将相对 URL（如 /uploads/...）解析为浏览器可访问的绝对 URL，用于预览
function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url
  return url
}

// 格式化文件大小
function formatBytes(n: number): string {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`
}

// VideoUploadField 视频上传字段，Form value 为视频 URL 字符串
// - 真实上传进度（onUploadProgress）
// - 支持手动填写外链 URL（allowManualUrl）
// - 上传成功后可选自动联动 play_source 字段（linkSourceField）
function VideoUploadField({
  value,
  onChange,
  linkSourceField,
  allowManualUrl = true,
}: {
  value?: string
  onChange?: (v?: string) => void
  linkSourceField?: string
  allowManualUrl?: boolean
}) {
  const form = Form.useFormInstance()
  // 监听联动的播放源字段，用于在编辑场景下回显 engine 标签
  const watchedSource = Form.useWatch(linkSourceField, form) as string | undefined
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [engine, setEngine] = useState<string>('')
  const [size, setSize] = useState<number>(0)
  const [manualMode, setManualMode] = useState(false)
  const [manualUrl, setManualUrl] = useState('')

  // 编辑回显时，同步 engine 标签
  useEffect(() => {
    if (watchedSource && !engine) {
      setEngine(watchedSource)
    }
  }, [watchedSource, engine])

  const uploadProps: UploadProps = {
    accept: 'video/mp4,video/quicktime,.mp4,.m3u8,.ts,.mov,.m4v',
    maxCount: 1,
    showUploadList: false,
    disabled: uploading,
    beforeUpload: (file) => {
      // 客户端大小校验，与后端一致：500MB
      const limit = 500 * 1024 * 1024
      if (file.size > limit) {
        message.error(`视频大小不能超过 500MB（当前 ${formatBytes(file.size)}）`)
        return Upload.LIST_IGNORE
      }
      return true
    },
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options
      setUploading(true)
      setProgress(0)
      try {
        const res: any = await uploadApi.video(file as File, (p) => setProgress(p))
        const url = res?.url || res?.path
        const eng = res?.engine || 'local'
        if (!url) throw new Error('上传返回数据异常：未拿到 URL')
        onChange?.(url)
        setEngine(eng)
        setSize(Number(res?.size) || (file as File).size || 0)
        // 自动联动播放源字段
        if (linkSourceField) {
          form.setFieldValue(linkSourceField, eng)
        }
        onSuccess?.({}, file)
        message.success(`视频上传成功（${eng}）`)
      } catch (e: any) {
        onError?.(e)
        message.error(e.message || '视频上传失败')
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 800)
      }
    },
  }

  const applyManualUrl = () => {
    const u = manualUrl.trim()
    if (!u) {
      message.warning('请输入视频 URL')
      return
    }
    onChange?.(u)
    setEngine('external')
    setSize(0)
    if (linkSourceField) {
      form.setFieldValue(linkSourceField, 'external')
    }
    setManualMode(false)
    setManualUrl('')
    message.success('已设置外链地址')
  }

  const clearValue = () => {
    onChange?.(undefined)
    setEngine('')
    setSize(0)
    if (linkSourceField) {
      form.setFieldValue(linkSourceField, undefined)
    }
  }

  return (
    <div>
      <Space wrap>
        <Upload {...uploadProps}>
          <Button icon={<PlusOutlined />} loading={uploading} disabled={uploading}>
            {uploading ? `上传中 ${progress}%` : '上传视频'}
          </Button>
        </Upload>
        {allowManualUrl && !uploading && (
          <Button
            icon={<LinkOutlined />}
            onClick={() => setManualMode((v) => !v)}
            type={manualMode ? 'primary' : 'default'}
          >
            填写外链
          </Button>
        )}
        {value && !uploading && (
          <Button icon={<DeleteOutlined />} onClick={clearValue} danger>
            清除
          </Button>
        )}
      </Space>

      {uploading && progress > 0 && (
        <div style={{ marginTop: 8, maxWidth: 400 }}>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div
              style={{
                background: '#1890ff',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.2s',
              }}
            />
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>上传进度 {progress}%</div>
        </div>
      )}

      {manualMode && !uploading && (
        <div style={{ marginTop: 8 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="粘贴视频外链 URL，如 https://cdn.example.com/ep1.mp4"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onPressEnter={applyManualUrl}
            />
            <Button type="primary" onClick={applyManualUrl}>
              确定
            </Button>
          </Space.Compact>
        </div>
      )}

      {value && !uploading && (
        <div style={{ marginTop: 8 }}>
          <video
            src={resolvePreviewUrl(value)}
            controls
            style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 4, background: '#000' }}
          />
          <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {engine && <Tag color="blue">{engine}</Tag>}
            {size > 0 && <span style={{ fontSize: 12, color: '#999' }}>{formatBytes(size)}</span>}
            <span style={{ fontSize: 12, color: '#999', wordBreak: 'break-all', flex: 1, minWidth: 100 }}>
              {value}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
