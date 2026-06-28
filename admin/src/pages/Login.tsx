import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const res: any = await authApi.login(values)
      const token = res?.token || res?.access_token || res?.data?.token
      const user = res?.user || res?.admin || res?.data?.user || { username: values.username }
      if (token) {
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_user', JSON.stringify(user))
        message.success('登录成功')
        navigate('/dashboard', { replace: true })
      } else {
        message.error('登录返回数据异常')
      }
    } catch (e: any) {
      message.error(e.message || '登录失败，请检查用户名或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">DramaMax 管理后台</h1>
        <p className="login-subtitle">短剧小程序运营管理系统</p>
        <Form
          name="admin_login"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
