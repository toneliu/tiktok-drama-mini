export interface FieldConfig {
  name: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'date' | 'password' | 'image' | 'video'
  options?: { label: string; value: any }[]
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  maxLength?: number
  span?: number
  // 仅 'video' 类型：上传成功后，将返回的 engine（local/oss/tos/qiniu）自动写入指定字段
  linkSourceField?: string
  // 仅 'video' 类型：是否允许手动填写外链 URL（默认 true）
  allowManualUrl?: boolean
}

export interface SearchField {
  name: string
  label: string
  type?: 'text' | 'select'
  options?: { label: string; value: any }[]
  placeholder?: string
}

export interface ListResponse {
  list?: any[]
  items?: any[]
  total?: number
  page?: number
  page_size?: number
  current?: number
}

export interface CRUDPageProps {
  title?: string
  rowKey?: string
  columns: any[]
  fetchFn: (params: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
  updateFn?: (id: string, data: any) => Promise<any>
  deleteFn?: (id: string) => Promise<any>
  searchFields?: SearchField[]
  formFields?: FieldConfig[]
  formWidth?: number
  createText?: string
  hideAdd?: boolean
  extraFilters?: React.ReactNode
  transformRecord?: (record: any) => Record<string, any>
  transformSubmit?: (values: any) => any
  defaultPageSize?: number
}
