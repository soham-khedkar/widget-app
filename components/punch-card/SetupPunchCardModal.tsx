/**
 * Setup Punch Card Modal
 * Modal for setting relationship start date
 */

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

interface SetupPunchCardModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (startDate: string) => Promise<boolean>
}

export function SetupPunchCardModal({ visible, onClose, onCreate }: SetupPunchCardModalProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidDate = () => {
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    const y = parseInt(year, 10)

    if (m < 1 || m > 12) return false
    if (d < 1 || d > 31) return false
    if (y < 1900 || y > new Date().getFullYear()) return false

    const date = new Date(y, m - 1, d)
    return date <= new Date()
  }

  const handleCreate = async () => {
    if (!isValidDate()) {
      setError('Please enter a valid date')
      return
    }

    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    const y = parseInt(year, 10)

    const dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`

    setCreating(true)
    setError(null)
    const success = await onCreate(dateStr)
    setCreating(false)

    if (success) {
      handleClose()
    } else {
      setError('Failed to create punch card')
    }
  }

  const handleClose = () => {
    setMonth('')
    setDay('')
    setYear('')
    setError(null)
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
          <Text style={[styles.title, { color: colors.text }]}>When Did It Start?</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Heart Icon */}
          <View style={[styles.iconContainer, { borderColor: colors.border }]}>
            <Ionicons name="heart" size={48} color={colors.primary} />
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter the date when your relationship started.{'\n'}
            We&apos;ll count every day since then! 💕
          </Text>

          {/* Date Input */}
          <View style={styles.dateInputContainer}>
            <View style={styles.dateInputGroup}>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="MM"
                placeholderTextColor={colors.textSecondary}
                value={month}
                onChangeText={(text) => setMonth(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Month</Text>
            </View>

            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>

            <View style={styles.dateInputGroup}>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="DD"
                placeholderTextColor={colors.textSecondary}
                value={day}
                onChangeText={(text) => setDay(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Day</Text>
            </View>

            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>

            <View style={styles.dateInputGroup}>
              <TextInput
                style={[
                  styles.dateInput,
                  styles.yearInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="YYYY"
                placeholderTextColor={colors.textSecondary}
                value={year}
                onChangeText={(text) => setYear(text.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Year</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
              (!month || !day || !year) && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!month || !day || !year || creating}
            activeOpacity={0.8}
          >
            {creating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="heart" size={20} color={colors.background} />
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  Start Counting
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dateInputGroup: {
    alignItems: 'center',
  },
  dateInput: {
    width: 60,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  yearInput: {
    width: 80,
  },
  dateLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  dateSeparator: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
})
