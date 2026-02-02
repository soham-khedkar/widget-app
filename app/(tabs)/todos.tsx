import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Todo, TodoGroup, useTodos } from '@/hooks/use-todos'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TodosScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const {
    groups,
    todos,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    fetchTodos,
    getTodosForGroup,
  } = useTodos()

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TodoGroup | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [groupTitle, setGroupTitle] = useState('')
  const [todoTitle, setTodoTitle] = useState('')
  const [todoDescription, setTodoDescription] = useState('')
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())

  // Process pending widget actions when app opens
  useEffect(() => {
    const processPendingActions = async () => {
      try {
        const pendingActionsStr = await AsyncStorage.getItem('TruLuvWidgetPendingActions')
        if (!pendingActionsStr) return

        const pendingActions = JSON.parse(pendingActionsStr)
        if (pendingActions.length === 0) return

        // Process each pending action
        for (const action of pendingActions) {
          if (action.type === 'TOGGLE_TODO' && action.todoId) {
            await toggleTodo(action.todoId)
          }
        }

        // Clear processed actions
        await AsyncStorage.removeItem('TruLuvWidgetPendingActions')
      } catch (error) {
        console.error('Error processing pending widget actions:', error)
      }
    }

    processPendingActions()
  }, [toggleTodo])

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      Alert.alert('Error', 'Please enter a group title')
      return
    }

    const { error } = await createGroup(groupTitle.trim())
    if (error) {
      Alert.alert('Error', error)
    } else {
      setGroupTitle('')
      setShowGroupModal(false)
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupTitle.trim()) {
      Alert.alert('Error', 'Please enter a group title')
      return
    }

    const { error } = await updateGroup(editingGroup.id, { title: groupTitle.trim() })
    if (error) {
      Alert.alert('Error', error)
    } else {
      setEditingGroup(null)
      setGroupTitle('')
      setShowGroupModal(false)
    }
  }

  const handleDeleteGroup = (group: TodoGroup) => {
    Alert.alert('Delete Group', `Are you sure you want to delete "${group.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteGroup(group.id)
          if (error) {
            Alert.alert('Error', error)
          } else if (selectedGroup === group.id) {
            setSelectedGroup(null)
          }
        },
      },
    ])
  }

  const handleCreateTodo = async () => {
    if (!selectedGroup || !todoTitle.trim()) {
      Alert.alert('Error', 'Please enter a todo title')
      return
    }

    const { error } = await createTodo(selectedGroup, todoTitle.trim(), todoDescription.trim() || undefined)
    if (error) {
      Alert.alert('Error', error)
    } else {
      setTodoTitle('')
      setTodoDescription('')
      setShowTodoModal(false)
      fetchTodos(selectedGroup)
    }
  }

  const handleUpdateTodo = async () => {
    if (!editingTodo || !todoTitle.trim()) {
      Alert.alert('Error', 'Please enter a todo title')
      return
    }

    const { error } = await updateTodo(editingTodo.id, {
      title: todoTitle.trim(),
      description: todoDescription.trim() || null,
    })
    if (error) {
      Alert.alert('Error', error)
    } else {
      setEditingTodo(null)
      setTodoTitle('')
      setTodoDescription('')
      setShowTodoModal(false)
    }
  }

  const handleDeleteTodo = (todo: Todo) => {
    Alert.alert('Delete Todo', `Are you sure you want to delete "${todo.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteTodo(todo.id)
          if (error) {
            Alert.alert('Error', error)
          }
        },
      },
    ])
  }

  const openEditGroup = (group: TodoGroup) => {
    setEditingGroup(group)
    setGroupTitle(group.title)
    setShowGroupModal(true)
  }

  const openEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setTodoTitle(todo.title)
    setTodoDescription(todo.description || '')
    setShowTodoModal(true)
  }

  const closeModals = () => {
    setShowGroupModal(false)
    setShowTodoModal(false)
    setEditingGroup(null)
    setEditingTodo(null)
    setGroupTitle('')
    setTodoTitle('')
    setTodoDescription('')
  }

  const toggleTodoExpansion = (todoId: string) => {
    setExpandedTodos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(todoId)) {
        newSet.delete(todoId)
      } else {
        newSet.add(todoId)
      }
      return newSet
    })
  }

  const MAX_DESCRIPTION_LENGTH = 100

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const currentTodos = selectedGroup ? getTodosForGroup(selectedGroup) : []

  // Fetch all todos when groups are loaded to get accurate counts
  useEffect(() => {
    if (groups.length > 0 && todos.length === 0 && !loading) {
      // Fetch todos for all groups to show accurate counts
      groups.forEach(group => {
        fetchTodos(group.id)
      })
    }
  }, [groups.length, loading])

  if (loading && groups.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading todos...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Todo Groups</Text>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.border, borderWidth: 2 }]}
              onPress={() => {
                setEditingGroup(null)
                setGroupTitle('')
                setShowGroupModal(true)
              }}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Todo Groups */}
            {!loading && groups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No todo groups yet.{'\n'}Create one to get started!
                </Text>
              </View>
            ) : (
              <View style={styles.groupsContainer}>
                {groups.map((group) => (
                  <View
                    key={group.id}
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selectedGroup === group.id ? colors.primary : colors.border,
                        borderWidth: selectedGroup === group.id ? 2 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.groupHeader}
                      onPress={() => {
                        if (selectedGroup === group.id) {
                          setSelectedGroup(null)
                        } else {
                          setSelectedGroup(group.id)
                          fetchTodos(group.id)
                        }
                      }}
                    >
                      <View style={styles.groupTitleContainer}>
                        <Text style={[styles.groupTitle, { color: colors.primary }]}>{group.title}</Text>
                        <Text style={[styles.groupCount, { color: colors.textSecondary }]}>
                          {todos.filter(t => t.group_id === group.id).length} todos
                        </Text>
                      </View>
                      <Ionicons
                        name={selectedGroup === group.id ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    {/* Group Actions */}
                    <View style={styles.groupActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openEditGroup(group)}
                      >
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteGroup(group)}
                      >
                        <Ionicons name="trash" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Todos in this group */}
                    {selectedGroup === group.id && (
                      <View style={styles.todosContainer}>
                        <TouchableOpacity
                          style={[styles.addTodoButton, { borderColor: colors.border, borderWidth: 1 }]}
                          onPress={() => {
                            setEditingTodo(null)
                            setTodoTitle('')
                            setTodoDescription('')
                            setShowTodoModal(true)
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                          <Text style={[styles.addTodoText, { color: colors.primary }]}>Add Todo</Text>
                        </TouchableOpacity>

                        {currentTodos.length === 0 ? (
                          <Text style={[styles.emptyTodoText, { color: colors.textSecondary }]}>
                            No todos in this group
                          </Text>
                        ) : (
                          currentTodos.map((todo) => (
                            <View
                              key={todo.id}
                              style={[
                                styles.todoItem,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: colors.border,
                                  borderWidth: 1,
                                  opacity: todo.completed ? 0.6 : 1,
                                },
                              ]}
                            >
                              <View style={styles.todoMainContent}>
                                <TouchableOpacity
                                  style={styles.todoContent}
                                  onPress={() => toggleTodo(todo.id)}
                                >
                                  <Ionicons
                                    name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={24}
                                    color={todo.completed ? colors.success : colors.primary}
                                  />
                                  <View style={styles.todoTextContainer}>
                                    <Text
                                      style={[
                                        styles.todoTitle,
                                        {
                                          color: colors.primary,
                                          textDecorationLine: todo.completed ? 'line-through' : 'none',
                                        },
                                      ]}
                                    >
                                      {todo.title}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                                {todo.description && (
                                  <View style={styles.descriptionContainer}>
                                    {expandedTodos.has(todo.id) && (
                                      <View style={styles.todoActionsTop}>
                                        <TouchableOpacity
                                          style={styles.todoActionButton}
                                          onPress={() => openEditTodo(todo)}
                                        >
                                          <Ionicons name="pencil" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.todoActionButton}
                                          onPress={() => handleDeleteTodo(todo)}
                                        >
                                          <Ionicons name="trash" size={16} color={colors.error} />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                    <Text style={[styles.todoDescription, { color: colors.textSecondary }]}>
                                      {expandedTodos.has(todo.id) || todo.description.length <= MAX_DESCRIPTION_LENGTH
                                        ? todo.description
                                        : truncateDescription(todo.description, MAX_DESCRIPTION_LENGTH)}
                                    </Text>
                                    {todo.description.length > MAX_DESCRIPTION_LENGTH && (
                                      <TouchableOpacity
                                        onPress={() => toggleTodoExpansion(todo.id)}
                                        style={styles.readMoreButton}
                                      >
                                        <Text style={[styles.readMoreText, { color: colors.primary }]}>
                                          {expandedTodos.has(todo.id) ? 'Read less' : 'Read more'}
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                    {!expandedTodos.has(todo.id) && (
                                      <View style={styles.todoActions}>
                                        <TouchableOpacity
                                          style={styles.todoActionButton}
                                          onPress={() => openEditTodo(todo)}
                                        >
                                          <Ionicons name="pencil" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.todoActionButton}
                                          onPress={() => handleDeleteTodo(todo)}
                                        >
                                          <Ionicons name="trash" size={16} color={colors.error} />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                )}
                                {!todo.description && (
                                  <View style={styles.todoActions}>
                                    <TouchableOpacity
                                      style={styles.todoActionButton}
                                      onPress={() => openEditTodo(todo)}
                                    >
                                      <Ionicons name="pencil" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.todoActionButton}
                                      onPress={() => handleDeleteTodo(todo)}
                                    >
                                      <Ionicons name="trash" size={16} color={colors.error} />
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Group Modal */}
        <Modal visible={showGroupModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>
                {editingGroup ? 'Edit Group' : 'New Group'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 2,
                    color: colors.primary,
                  },
                ]}
                placeholder="Group title"
                placeholderTextColor={colors.textSecondary}
                value={groupTitle}
                onChangeText={setGroupTitle}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: colors.border, borderWidth: 2 }]}
                  onPress={closeModals}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: colors.border, borderWidth: 2, backgroundColor: colors.primary }]}
                  onPress={editingGroup ? handleUpdateGroup : handleCreateGroup}
                >
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>
                    {editingGroup ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Todo Modal */}
        <Modal visible={showTodoModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>
                {editingTodo ? 'Edit Todo' : 'New Todo'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 2,
                    color: colors.primary,
                  },
                ]}
                placeholder="Todo title"
                placeholderTextColor={colors.textSecondary}
                value={todoTitle}
                onChangeText={setTodoTitle}
                autoFocus
              />
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 2,
                    color: colors.primary,
                  },
                ]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={todoDescription}
                onChangeText={setTodoDescription}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: colors.border, borderWidth: 2 }]}
                  onPress={closeModals}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: colors.border, borderWidth: 2, backgroundColor: colors.primary }]}
                  onPress={editingTodo ? handleUpdateTodo : handleCreateTodo}
                >
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>
                    {editingTodo ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  groupsContainer: {
    gap: 12,
  },
  groupCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 3,
    }),
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitleContainer: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupCount: {
    fontSize: 12,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
  },
  todosContainer: {
    marginTop: 16,
    gap: 8,
  },
  addTodoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  addTodoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyTodoText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 2,
    }),
  },
  todoMainContent: {
    flex: 1,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    marginLeft: 36, // Align with text (24px icon + 12px gap)
  },
  todoDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  readMoreButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  todoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  todoActionsTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  todoActionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 8,
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
