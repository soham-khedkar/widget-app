/**
 * Create Streak Modal
 * Modal for creating new streaks with AI-generated backgrounds
 */

import { Colors } from '@/constants/theme'
import { useAI } from '@/hooks/use-ai'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
    ActivityIndicator,
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

interface CreateStreakModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (topic: string, description?: string, target?: number) => Promise<boolean>
}

// Preset streak categories
const STREAK_PRESETS = [
  { icon: '💬', label: 'Daily Chat', topic: 'Daily Conversation' },
  { icon: '📸', label: 'Share Photos', topic: 'Photo Sharing' },
  { icon: '😘', label: 'Good Morning', topic: 'Good Morning Texts' },
  { icon: '🌙', label: 'Good Night', topic: 'Good Night Messages' },
  { icon: '🎬', label: 'Watch Together', topic: 'Movie/Show Together' },
  { icon: '🎮', label: 'Game Night', topic: 'Gaming Together' },
  { icon: '📖', label: 'Book Club', topic: 'Reading Together' },
  { icon: '🏃', label: 'Workout', topic: 'Workout Motivation' },
]

export function CreateStreakModal({ visible, onClose, onCreate }: CreateStreakModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { generateStreakIdeas, loading: aiLoading } = useAI()

  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [targetDays, setTargetDays] = useState('')
  const [creating, setCreating] = useState(false)
  const [aiIdeas, setAiIdeas] = useState<string[]>([])
  const [showAiIdeas, setShowAiIdeas] = useState(false)

  const handleCreate = async () => {
    if (!topic.trim() || creating) return

    setCreating(true)
    const success = await onCreate(
      topic.trim(),
      description.trim() || undefined,
      targetDays ? parseInt(targetDays, 10) : undefined
    )
    setCreating(false)

    if (success) {
      handleClose()
    }
  }

  const handlePresetSelect = (preset: typeof STREAK_PRESETS[0]) => {
    setTopic(preset.topic)
  }

  const handleGetAiIdeas = async () => {
    if (aiLoading) return

    const ideas = await generateStreakIdeas('long-distance relationship activities')
    if (ideas) {
      setAiIdeas(ideas)
      setShowAiIdeas(true)
    }
  }

  const handleClose = () => {
    setTopic('')
    setDescription('')
    setTargetDays('')
    setAiIdeas([])
    setShowAiIdeas(false)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Streak</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!topic.trim() || creating}
            style={[styles.createButton, !topic.trim() && styles.createButtonDisabled]}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  { color: topic.trim() ? colors.primary : colors.textSecondary },
                ]}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Topic Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>What&apos;s your streak?</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g., Daily Video Call"
              placeholderTextColor={colors.textSecondary}
              value={topic}
              onChangeText={setTopic}
              maxLength={100}
            />
          </View>

          {/* Preset Suggestions */}
          <View style={styles.presetsSection}>
            <View style={styles.presetsHeader}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Ideas</Text>
              <TouchableOpacity onPress={handleGetAiIdeas} disabled={aiLoading}>
                {aiLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.aiButton, { color: colors.primary }]}>
                    ✨ AI Ideas
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.presetGrid}>
              {STREAK_PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetItem,
                    {
                      backgroundColor: topic === preset.topic ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text
                    style={[
                      styles.presetLabel,
                      { color: topic === preset.topic ? colors.background : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Ideas (when generated) */}
          {showAiIdeas && aiIdeas.length > 0 && (
            <View style={styles.aiIdeasSection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>AI Suggestions</Text>
              {aiIdeas.map((idea, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.aiIdeaItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setTopic(idea)}
                >
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <Text style={[styles.aiIdeaText, { color: colors.text }]} numberOfLines={2}>
                    {idea}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add some details..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>

          {/* Target Days */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Goal (optional)
            </Text>
            <View style={styles.targetRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.targetInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="30"
                placeholderTextColor={colors.textSecondary}
                value={targetDays}
                onChangeText={(text) => setTargetDays(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>days</Text>
            </View>
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="color-palette" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              AI will generate a beautiful gradient background based on your streak topic! ✨
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  presetIcon: {
    fontSize: 16,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  aiIdeasSection: {
    marginBottom: 20,
  },
  aiIdeaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  aiIdeaText: {
    flex: 1,
    fontSize: 14,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetInput: {
    width: 100,
    textAlign: 'center',
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
})
