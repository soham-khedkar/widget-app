import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './use-auth-context'

export interface TodoGroup {
  id: string
  user_id: string
  partner_id: string | null
  title: string
  color: string
  icon: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Todo {
  id: string
  group_id: string
  user_id: string
  partner_id: string | null
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  reminder_at: string | null
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  created_by: string | null
}

export function useTodos() {
  const { session } = useAuthContext()
  const [groups, setGroups] = useState<TodoGroup[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all todo groups
  const fetchGroups = async () => {
    if (!session) return

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('todo_groups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setGroups(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching todo groups:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch todos for a specific group
  const fetchTodos = async (groupId: string) => {
    if (!session) return

    try {
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTodos((prev) => {
        const filtered = prev.filter((t) => t.group_id !== groupId)
        return [...filtered, ...(data || [])]
      })
      setError(null)
    } catch (err: any) {
      console.error('Error fetching todos:', err)
      setError(err.message)
    }
  }

  // Create a new todo group
  const createGroup = async (title: string, color: string = '#000000') => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: createError } = await supabase
        .from('todo_groups')
        .insert({
          user_id: session.user.id,
          title,
          color,
          created_by: session.user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      setGroups((prev) => [data, ...prev])
      return { data, error: null }
    } catch (err: any) {
      console.error('Error creating todo group:', err)
      return { data: null, error: err.message }
    }
  }

  // Update a todo group
  const updateGroup = async (groupId: string, updates: Partial<TodoGroup>) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('todo_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single()

      if (updateError) throw updateError

      setGroups((prev) => prev.map((g) => (g.id === groupId ? data : g)))
      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating todo group:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete a todo group
  const deleteGroup = async (groupId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { error: deleteError } = await supabase
        .from('todo_groups')
        .delete()
        .eq('id', groupId)

      if (deleteError) throw deleteError

      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      setTodos((prev) => prev.filter((t) => t.group_id !== groupId))
      return { error: null }
    } catch (err: any) {
      console.error('Error deleting todo group:', err)
      return { error: err.message }
    }
  }

  // Create a new todo
  const createTodo = async (
    groupId: string,
    title: string,
    description?: string,
    dueDate?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: createError } = await supabase
        .from('todos')
        .insert({
          group_id: groupId,
          user_id: session.user.id,
          title,
          description: description || null,
          due_date: dueDate || null,
          priority,
          created_by: session.user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      setTodos((prev) => [data, ...prev])
      return { data, error: null }
    } catch (err: any) {
      console.error('Error creating todo:', err)
      return { data: null, error: err.message }
    }
  }

  // Update a todo
  const updateTodo = async (todoId: string, updates: Partial<Todo>) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todoId)
        .select()
        .single()

      if (updateError) throw updateError

      setTodos((prev) => prev.map((t) => (t.id === todoId ? data : t)))
      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating todo:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete a todo
  const deleteTodo = async (todoId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)

      if (deleteError) throw deleteError

      setTodos((prev) => prev.filter((t) => t.id !== todoId))
      return { error: null }
    } catch (err: any) {
      console.error('Error deleting todo:', err)
      return { error: err.message }
    }
  }

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId)
    if (!todo) return { error: 'Todo not found' }

    return updateTodo(todoId, { completed: !todo.completed })
  }

  // Get todos for a specific group
  const getTodosForGroup = (groupId: string) => {
    return todos.filter((t) => t.group_id === groupId)
  }

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchGroups()
    } else {
      setLoading(false)
      setGroups([])
      setTodos([])
    }
  }, [session])

  return {
    groups,
    todos,
    loading,
    error,
    fetchGroups,
    fetchTodos,
    createGroup,
    updateGroup,
    deleteGroup,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    getTodosForGroup,
  }
}

