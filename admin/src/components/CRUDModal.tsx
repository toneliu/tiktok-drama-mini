import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Select, DatePicker } from 'antd'
import type { FieldConfig } from './types'
import dayjs from 'dayjs'

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
