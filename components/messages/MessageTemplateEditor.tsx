import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { QuickMessageTemplate } from '@/types/database'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
interface MessageTemplateEditorProps {
  visible: boolean
  template: QuickMessageTemplate | null
  onClose: () => void
  onSave: (template: Omit<QuickMessageTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>
  onUpdate?: (templateId: string, updates: Partial<QuickMessageTemplate>) => Promise<void>
  onDelete?: (templateId: string) => Promise<void>
}

const POPULAR_ICONS = [
  { name: 'heart', icon: 'heart' },
  { name: 'happy', icon: 'happy' },
  { name: 'star', icon: 'star' },
  { name: 'home', icon: 'home' },
  { name: 'sunny', icon: 'sunny' },
  { name: 'moon', icon: 'moon' },
  { name: 'chatbubbles', icon: 'chatbubbles' },
  { name: 'hand-left', icon: 'hand-left' },
  { name: 'balloon', icon: 'balloon' },
  { name: 'sparkles', icon: 'sparkles' },
]

export function MessageTemplateEditor({
  visible,
  template,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: MessageTemplateEditorProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    console.log('[MessageTemplateEditor] visible changed:', visible)
  }, [visible])

  const handleBackdropPress = () => {
    console.log('[MessageTemplateEditor] backdrop pressed, closing modal')
    onClose()
  }

  useEffect(() => {
    if (template) {
      setText(template.text)
      setEmoji(template.emoji || null)
    } else {
      setText('')
      setEmoji(null)
    }
  }, [template, visible])

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Message text is required')
      return
    }

    try {
      setSaving(true)

      if (template && onUpdate) {
        await onUpdate(template.id, { text: text.trim(), emoji })
      } else {
        await onSave({
          text: text.trim(),
          emoji,
          color: null,
          order_index: 0,
        })
      }

      onClose()
      setText('')
      setEmoji(null)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!template || !onDelete) return

    Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete(template.id)
            onClose()
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete template')
          }
        },
      },
    ])
  }

  console.log('[MessageTemplateEditor] Rendering, visible:', visible)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        console.log('[MessageTemplateEditor] onRequestClose called')
        onClose()
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {template ? 'Edit Template' : 'New Template'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[MessageTemplateEditor] Close button pressed')
                onClose()
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Text Input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Message</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={text}
                onChangeText={setText}
                placeholder="e.g., Love you ❤️"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={100}
              />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {text.length}/100 characters
              </Text>
            </View>

            {/* Icon Picker */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Icon (Optional)</Text>
              <View style={styles.emojiContainer}>
                {POPULAR_ICONS.map(({ name, icon }) => {
                  const isSelected = emoji === name
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        styles.emojiButton,
                        {
                          backgroundColor: isSelected ? colors.primary + '30' : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setEmoji(isSelected ? null : name)}
                    >
                      <Ionicons
                        name={icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.text}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={[
                  styles.clearEmojiButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setEmoji(null)}
              >
                <Text style={[styles.clearEmojiText, { color: colors.textSecondary }]}>
                  Clear icon
                </Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {text.trim() && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Preview</Text>
                <View
                  style={[
                    styles.previewBubble,
                    {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary + '40',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {emoji && (() => {
                      const iconData = POPULAR_ICONS.find(i => i.name === emoji)
                      return iconData ? (
                        <Ionicons
                          name={iconData.icon as any}
                          size={20}
                          color={colors.primary}
                          style={{ marginRight: 8 }}
                        />
                      ) : null
                    })()}
                    <Text
                      style={[
                        styles.previewText,
                        { color: colors.primary },
                      ]}
                    >
                      {text.trim()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {template && onDelete && (
              <TouchableOpacity
                style={[styles.deleteButton, { borderColor: colors.error }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <View style={styles.footerSpacer} />
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                console.log('[MessageTemplateEditor] Cancel button pressed')
                onClose()
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.6 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={saving || !text.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.background }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    height: '85%', // Open modal to 85% of screen height
    flexDirection: 'column',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 8,
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  clearEmojiButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  clearEmojiText: {
    fontSize: 14,
  },
  previewBubble: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacer: {
    flex: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
