import { useCallback, useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  message,
  Popconfirm,
  Form,
} from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import CRUDModal from './CRUDModal'
import type { CRUDPageProps } from './types'

export default function CRUDPage(props: CRUDPageProps) {
  const {
    title,
    rowKey = 'id',
    columns,
    fetchFn,
    createFn,
    updateFn,
    deleteFn,
    searchFields = [],
    formFields = [],
    formWidth = 640,
    createText = '新增',
    hideAdd = false,
    extraFilters,
    transformRecord,
    transformSubmit,
    defaultPageSize = 10,
  } = props

  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchForm] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
        ...filters,
      }
      const res: any = await fetchFn(params)
      const list = res?.rows || res?.list || res?.items || res?.data || []
      const t = res?.total ?? (Array.isArray(list) ? list.length : 0)
      setData(Array.isArray(list) ? list : [])
      setTotal(typeof t === 'number' ? t : 0)
    } catch (e: any) {
      message.error(e.message || '加载失败')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, page, pageSize, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const cleaned: Record<string, any> = {}
    Object.keys(values).forEach((k) => {
      if (values[k] !== undefined && values[k] !== null && values[k] !== '') {
        cleaned[k] = values[k]
      }
    })
    setFilters(cleaned)
    setPage(1)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPage(1)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    const payload = transformSubmit ? transformSubmit(values) : values
    setSubmitting(true)
    try {
      if (editing) {
        const id = String(editing[rowKey] ?? editing.id)
        await updateFn!(id, payload)
        message.success('更新成功')
      } else {
        await createFn!(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      setEditing(null)
      loadData()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (record: any) => {
    try {
      const id = String(record[rowKey] ?? record.id)
      await deleteFn!(id)
      message.success('删除成功')
      loadData()
    } catch (e: any) {
      message.error(e.message || '删除失败')
    }
  }

  const hasActions = !!(createFn || updateFn || deleteFn)
  const canEdit = !!updateFn
  const canDelete = !!deleteFn

  const finalColumns = [...columns]
  if (hasActions) {
    finalColumns.push({
      title: '操作',
      key: '__action__',
      fixed: 'right' as const,
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确认删除该记录？"
              description="删除后不可恢复"
              okText="确认"
              cancelText="取消"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    })
  }

  const renderSearchBar = () => {
    if (searchFields.length === 0 && !extraFilters) return null
    return (
      <div className="table-toolbar">
        <Form form={searchForm} layout="inline" style={{ flex: 1 }}>
          <Space wrap>
            {searchFields.map((f) => {
              if (f.type === 'select') {
                return (
                  <Form.Item key={f.name} name={f.name} label={f.label}>
                    <Select
                      style={{ width: 180 }}
                      allowClear
                      placeholder={f.placeholder || `选择${f.label}`}
                      options={f.options}
                    />
                  </Form.Item>
                )
              }
              return (
                <Form.Item key={f.name} name={f.name} label={f.label}>
                  <Input
                    style={{ width: 180 }}
                    allowClear
                    placeholder={f.placeholder || `输入${f.label}`}
                    onPressEnter={handleSearch}
                  />
                </Form.Item>
              )
            })}
            {extraFilters}
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form>
      </div>
    )
  }

  return (
    <div>
      {renderSearchBar()}
      <div className="table-toolbar" style={{ marginTop: searchFields.length ? 0 : 0 }}>
        <div className="toolbar-left">
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </div>
        {!hideAdd && createFn && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {createText}
          </Button>
        )}
      </div>
      <Table
        rowKey={rowKey}
        columns={finalColumns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
      {formFields.length > 0 && (
        <CRUDModal
          open={modalOpen}
          title={editing ? `编辑${title || ''}` : `新增${title || ''}`}
          width={formWidth}
          fields={formFields}
          initialValues={editing ? (transformRecord ? transformRecord(editing) : editing) : {}}
          loading={submitting}
          onOk={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// Re-export Modal for pages that need custom confirm
export { Modal }
