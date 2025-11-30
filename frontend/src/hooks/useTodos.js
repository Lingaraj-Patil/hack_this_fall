import { useState, useEffect } from 'react'
import { todosAPI } from '../api/todos'

export function useTodos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTodos = async (params = {}) => {
    setLoading(true)
    try {
      const response = await todosAPI.getAll(params)
      setTodos(response.data.data)
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTodo = async (data) => {
    const response = await todosAPI.create(data)
    setTodos([...todos, response.data.data])
    return response.data.data
  }

  const updateTodo = async (todoId, data) => {
    const response = await todosAPI.update(todoId, data)
    setTodos(todos.map((t) => (t._id === todoId ? response.data.data : t)))
    return response.data.data
  }

  const deleteTodo = async (todoId) => {
    await todosAPI.delete(todoId)
    setTodos(todos.filter((t) => t._id !== todoId))
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  return {
    todos,
    loading,
    createTodo,
    updateTodo,
    deleteTodo,
    fetchTodos,
  }
}