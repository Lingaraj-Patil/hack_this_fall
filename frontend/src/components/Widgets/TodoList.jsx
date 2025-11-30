import { useState } from 'react'
import { Plus, Check, ChevronDown, Trash2 } from 'lucide-react'
import { useTodos } from '../../hooks/useTodos'
import toast from 'react-hot-toast'

export default function TodoList() {
  const { todos, createTodo, updateTodo, deleteTodo, loading } = useTodos()
  const [newTodoText, setNewTodoText] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    try {
      await createTodo({ text: newTodoText, priority: 'medium' })
      setNewTodoText('')
      toast.success('Todo added!')
    } catch (error) {
      toast.error('Failed to add todo')
    }
  }

  const handleToggleTodo = async (todo) => {
    try {
      await updateTodo(todo._id, { completed: !todo.completed })
    } catch (error) {
      toast.error('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId) => {
    try {
      await deleteTodo(todoId)
      toast.success('Todo deleted')
    } catch (error) {
      toast.error('Failed to delete todo')
    }
  }

  const incompleteTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  return (
    <div className="glass rounded-2xl p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg">To-Do Today</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/60 hover:text-white transition"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
          </button>
        </div>
        <span className="text-white/60 text-sm">{incompleteTodos.length}</span>
      </div>

      {isExpanded && (
        <>
          <form onSubmit={handleAddTodo} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {incompleteTodos.map((todo) => (
              <div
                key={todo._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition group"
              >
                <button
                  onClick={() => handleToggleTodo(todo)}
                  className="w-5 h-5 rounded border-2 border-white/40 hover:border-white flex items-center justify-center transition"
                >
                  {todo.completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="flex-1 text-white">{todo.text}</span>
                <button
                  onClick={() => handleDeleteTodo(todo._id)}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4 text-white/60 hover:text-red-400" />
                </button>
              </div>
            ))}

            {incompleteTodos.length === 0 && (
              <p className="text-white/40 text-center py-8">No tasks yet!</p>
            )}
          </div>

          {completedTodos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm mb-2">Completed ({completedTodos.length})</p>
              <div className="space-y-2">
                {completedTodos.slice(0, 3).map((todo) => (
                  <div key={todo._id} className="flex items-center gap-3 p-2 rounded-lg opacity-50">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="flex-1 text-white text-sm line-through">{todo.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
