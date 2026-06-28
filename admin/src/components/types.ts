export interface FieldConfig {
  name: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'date' | 'password'
  options?: { label: string; value: any }[]
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  maxLength?: number
  span?: number
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
