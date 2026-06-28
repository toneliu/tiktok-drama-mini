import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Switch, message, Space, Divider, Alert } from 'antd'
import { appConfigApi } from '../api'

const { TextArea } = Input

export default function AppConfigPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await appConfigApi.get()
      const data = res?.data || res || {}
      form.setFieldsValue({
        platform_name: data.platform_name || 'TikTok短剧',
        logo: data.logo || '',
        icon: data.icon || '',
        banner: data.banner || '',
        about_text: data.about_text || '',
        contact_text: data.contact_text || '',
        privacy_text: data.privacy_text || '',
        terms_text: data.terms_text || '',
        version: data.version || '1.0.0',
        force_update: data.force_update || false,
        min_version: data.min_version || '',
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
      await appConfigApi.update(values)
      message.success('保存成功')
      load()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Card
        title="平台配置"
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
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message="平台配置用于自定义客户端 App 显示的名称、Logo、启动图等视觉元素，以及版本更新策略。"
        />

        <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
          <Divider orientation="left">基本信息</Divider>

          <Form.Item
            name="platform_name"
            label="平台名称"
            tooltip="客户端顶部和启动画面显示的应用名称"
            rules={[{ required: true, message: '请输入平台名称' }]}
          >
            <Input placeholder="例如：TikTok短剧" />
          </Form.Item>

          <Form.Item
            name="version"
            label="当前版本号"
            tooltip="格式：1.0.0，用于客户端版本检测和强制更新判断"
          >
            <Input placeholder="1.0.0" />
          </Form.Item>

          <Form.Item name="force_update" label="强制更新" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item
            name="min_version"
            label="最低兼容版本"
            tooltip="低于此版本的客户端将被强制更新，留空则不限制"
          >
            <Input placeholder="例如：1.0.0（留空表示不限制）" />
          </Form.Item>

          <Divider orientation="left">视觉素材</Divider>

          <Form.Item
            name="logo"
            label="Logo"
            tooltip="建议尺寸 200x200，支持 PNG/JPG，客户端启动页显示"
          >
            <ImageUploadField />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
            tooltip="建议尺寸 128x128，支持 PNG/APK，用于客户端快捷方式图标"
          >
            <ImageUploadField />
          </Form.Item>

          <Form.Item
            name="banner"
            label="启动图"
            tooltip="建议尺寸 750x1334，客户端启动时全屏显示"
          >
            <ImageUploadField />
          </Form.Item>

          <Divider orientation="left">文本内容</Divider>

          <Form.Item
            name="about_text"
            label="关于我们"
            tooltip='客户端"关于我们"页面显示的富文本内容'
          >
            <TextArea rows={6} placeholder="请输入关于我们内容..." />
          </Form.Item>

          <Form.Item
            name="contact_text"
            label="联系我们"
            tooltip='客户端"联系我们"页面显示的内容'
          >
            <TextArea rows={4} placeholder="请输入联系方式..." />
          </Form.Item>

          <Form.Item
            name="privacy_text"
            label="隐私政策"
            tooltip="用户注册/登录时展示的隐私政策内容"
          >
            <TextArea rows={8} placeholder="请输入隐私政策..." />
          </Form.Item>

          <Form.Item
            name="terms_text"
            label="用户协议"
            tooltip="用户注册/登录时展示的用户服务协议内容"
          >
            <TextArea rows={8} placeholder="请输入用户协议..." />
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

// ImageUploadField 图片上传字段，与 CRUDModal 保持一致
import { useState } from 'react'
import { Upload, Modal, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { uploadApi } from '../api'
import type { UploadFile, UploadProps } from 'antd'

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
