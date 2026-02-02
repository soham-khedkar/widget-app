import { MessageBubble } from '@/components/messages/MessageBubble'
import { MessageTemplateEditor } from '@/components/messages/MessageTemplateEditor'
import { Colors } from '@/constants/theme'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useQuickMessages } from '@/hooks/use-quick-messages'
import { QuickMessageTemplate } from '@/types/database'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
const ICON_MAP: Record<string, string> = {
  heart: 'heart',
  happy: 'happy',
  star: 'star',
  home: 'home',
  sunny: 'sunny',
  moon: 'moon',
  chatbubbles: 'chatbubbles',
  'hand-left': 'hand-left',
  balloon: 'balloon',
  sparkles: 'sparkles',
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { session, profile } = useAuthContext()
  const {
    messages,
    templates,
    loading,
    error,
    sending,
    sendMessage,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    getUnreadCount,
  } = useQuickMessages()

  const messagesEndRef = useRef<FlatList>(null)

  const unreadCount = getUnreadCount()

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

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
          if (action.type === 'SEND_MESSAGE' && action.text) {
            await sendMessage(action.text, action.templateId)
          }
        }

        // Clear processed actions
        await AsyncStorage.removeItem('TruLuvWidgetPendingActions')
      } catch (error) {
        console.error('Error processing pending widget actions:', error)
      }
    }

    if (session && profile) {
      processPendingActions()
    }
  }, [session, profile, sendMessage])

  const handleTemplatePress = async (template: QuickMessageTemplate) => {
    const text = template.emoji ? `${template.emoji} ${template.text}` : template.text
    const result = await sendMessage(text, template.id)
    if (result.error) {
      Alert.alert('Error', result.error)
    }
  }

  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuickMessageTemplate | null>(null)

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateEditor(true)
  }

  const handleEditTemplate = (template: QuickMessageTemplate) => {
    setEditingTemplate(template)
    setShowTemplateEditor(true)
  }

  const handleSaveTemplate = async (templateData: Omit<QuickMessageTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const result = editingTemplate 
      ? await updateTemplate(editingTemplate.id, templateData)
      : await saveTemplate(templateData)
    
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setShowTemplateEditor(false)
      setEditingTemplate(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const result = await deleteTemplate(templateId)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setShowTemplateEditor(false)
      setEditingTemplate(null)
    }
  }

  // Show templates even without partner, but show message about needing partner to send
  const hasPartner = !!profile?.partner_id

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.primary }]}>Messages</Text>
              {unreadCount > 0 && (
                <Text style={[styles.unreadCount, { color: colors.primary }]}>
                  {unreadCount} new
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.border, borderWidth: 2 }]}
              onPress={handleAddTemplate}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Template Selector */}
          <View style={styles.templatesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Messages</Text>
            {!hasPartner && (
              <View style={[styles.partnerWarning, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.partnerWarningText, { color: colors.textSecondary }]}>
                  Connect with a partner to send messages
                </Text>
              </View>
            )}
            {templates.length === 0 ? (
              <View style={styles.emptyTemplates}>
                <Text style={[styles.emptyTemplatesText, { color: colors.textSecondary }]}>
                  No templates yet. Tap + to create one!
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.templatesScroll}
                contentContainerStyle={styles.templatesContent}
              >
                {templates.map((template) => {
                  const iconName = template.emoji ? ICON_MAP[template.emoji] : null
                  return (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateButton,
                        {
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.primary + '40',
                          opacity: hasPartner ? 1 : 0.6,
                        },
                      ]}
                      onPress={() => hasPartner && handleTemplatePress(template)}
                      onLongPress={() => handleEditTemplate(template)}
                      disabled={sending || !hasPartner}
                    >
                      {iconName && (
                        <Ionicons
                          name={iconName as any}
                          size={24}
                          color={colors.primary}
                          style={{ marginBottom: 6 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.templateText,
                          { color: colors.primary },
                        ]}
                        numberOfLines={2}
                      >
                        {template.text}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
          </View>

          {/* Messages History */}
          {hasPartner && (
            <View style={styles.messagesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Conversation</Text>
              {loading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading messages...
                </Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={colors.textSecondary}
                  style={{ opacity: 0.3, marginBottom: 12 }}
                />
                <Text style={[styles.emptyMessagesText, { color: colors.textSecondary }]}>
                  No messages yet.{'\n'}Tap a quick message above to start!
                </Text>
              </View>
            ) : (
              <FlatList
                ref={messagesEndRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isOwn={item.user_id === session?.user.id}
                    partnerName={profile.partner_id ? 'Partner' : undefined}
                  />
                )}
                contentContainerStyle={styles.messagesList}
                inverted={false}
                onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
              />
            )}
            </View>
          )}
        </View>

        {/* Template Editor Modal */}
        <MessageTemplateEditor
          visible={showTemplateEditor}
          template={editingTemplate}
          onClose={() => {
            setShowTemplateEditor(false)
            setEditingTemplate(null)
          }}
          onSave={handleSaveTemplate}
          onUpdate={updateTemplate}
          onDelete={handleDeleteTemplate}
        />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  unreadCount: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
  },
  templatesSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templatesScroll: {
    marginHorizontal: -16,
  },
  templatesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  templateButton: {
    minWidth: 100,
    maxWidth: 140,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  templateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyTemplates: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTemplatesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  messagesSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  messagesList: {
    paddingVertical: 8,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  partnerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  partnerWarningText: {
    fontSize: 14,
    flex: 1,
  },
})
