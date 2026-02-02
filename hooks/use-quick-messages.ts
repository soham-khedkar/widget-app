import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './use-auth-context'
import { QuickMessage, QuickMessageTemplate } from '@/types/database'

export function useQuickMessages() {
  const { session, profile } = useAuthContext()
  const [messages, setMessages] = useState<QuickMessage[]>([])
  const [templates, setTemplates] = useState<QuickMessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Fetch templates
  const fetchTemplates = async () => {
    if (!session) return

    try {
      const { data, error: fetchError } = await supabase
        .from('quick_message_templates')
        .select('*')
        .eq('user_id', session.user.id)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError
      setTemplates(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching templates:', err)
      setError(err.message)
    }
  }

  // Fetch messages (conversation with partner)
  const fetchMessages = async () => {
    if (!session || !profile?.partner_id) return

    try {
      setLoading(true)
      
      // Get messages where user is sender or receiver
      const { data, error: fetchError } = await supabase
        .from('quick_messages')
        .select('*')
        .or(`user_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(50) // Last 50 messages

      if (fetchError) throw fetchError
      
      // Reverse to show oldest first
      setMessages((data || []).reverse())
      setError(null)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Send a quick message
  const sendMessage = async (text: string, templateId?: string) => {
    if (!session || !profile?.partner_id) return { error: 'Not authenticated or no partner' }

    try {
      setSending(true)

      const { data, error: insertError } = await supabase
        .from('quick_messages')
        .insert({
          user_id: session.user.id,
          partner_id: profile.partner_id,
          text,
          template_id: templateId || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Add to local state
      setMessages((prev) => [...prev, data])
      return { data, error: null }
    } catch (err: any) {
      console.error('Error sending message:', err)
      return { data: null, error: err.message }
    } finally {
      setSending(false)
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('quick_messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('partner_id', session.user.id) // Only recipient can mark as read
        .select()
        .single()

      if (updateError) throw updateError

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...data } : m))
      )
      return { data, error: null }
    } catch (err: any) {
      console.error('Error marking message as read:', err)
      return { data: null, error: err.message }
    }
  }

  // Create or update template
  const saveTemplate = async (template: Omit<QuickMessageTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      // Check if template with same text already exists
      const existingTemplate = templates.find(t => t.text.trim().toLowerCase() === template.text.trim().toLowerCase())
      if (existingTemplate) {
        return { data: null, error: 'A template with this message already exists' }
      }

      // Get max order_index to append at the end
      const maxOrder = templates.length > 0 
        ? Math.max(...templates.map(t => t.order_index)) + 1
        : 0

      const { data, error: insertError } = await supabase
        .from('quick_message_templates')
        .insert({
          user_id: session.user.id,
          text: template.text.trim(),
          emoji: template.emoji || null,
          color: template.color || null,
          order_index: maxOrder,
        })
        .select()
        .single()

      if (insertError) {
        // Handle duplicate key error
        if (insertError.code === '23505') {
          return { data: null, error: 'A template with this message already exists' }
        }
        throw insertError
      }

      setTemplates((prev) => [...prev, data].sort((a, b) => a.order_index - b.order_index))
      return { data, error: null }
    } catch (err: any) {
      console.error('Error saving template:', err)
      return { data: null, error: err.message }
    }
  }

  // Update template
  const updateTemplate = async (templateId: string, updates: Partial<QuickMessageTemplate>) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('quick_message_templates')
        .update(updates)
        .eq('id', templateId)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, ...data } : t))
      )
      return { data, error: null }
    } catch (err: any) {
      console.error('Error updating template:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { error: deleteError } = await supabase
        .from('quick_message_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', session.user.id)

      if (deleteError) throw deleteError

      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      return { error: null }
    } catch (err: any) {
      console.error('Error deleting template:', err)
      return { error: err.message }
    }
  }

  // Get unread count
  const getUnreadCount = () => {
    if (!session) return 0
    return messages.filter((m) => !m.read && m.partner_id === session.user.id).length
  }

  // Real-time subscription
  useEffect(() => {
    if (!session) {
      setLoading(false)
      setMessages([])
      setTemplates([])
      return
    }

    // Always fetch templates (even without partner)
    const loadTemplates = async () => {
      await fetchTemplates()
      // If no partner, set loading to false after templates load
      if (!profile?.partner_id) {
        setLoading(false)
      }
    }
    
    loadTemplates()
    
    // Only fetch messages if user has a partner
    if (profile?.partner_id) {
      fetchMessages()
    } else {
      setMessages([])
    }

    // Subscribe to message changes (only if user has partner)
    let messageChannel: any = null
    let partnerChannel: any = null
    
    if (profile?.partner_id) {
      messageChannel = supabase
        .channel('quick_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quick_messages',
            filter: `user_id=eq.${session.user.id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newMessage = payload.new as QuickMessage
              setMessages((prev) => [...prev, newMessage])
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedMessage = payload.new as QuickMessage
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              )
            }
          }
        )
        .subscribe()

      // Also listen for partner's messages
      partnerChannel = supabase
        .channel('partner_quick_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quick_messages',
            filter: `partner_id=eq.${session.user.id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newMessage = payload.new as QuickMessage
              setMessages((prev) => [...prev, newMessage])
              // Auto-mark as read after a short delay
              setTimeout(() => {
                markAsRead(newMessage.id)
              }, 500)
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedMessage = payload.new as QuickMessage
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              )
            }
          }
        )
        .subscribe()
    }

    // Subscribe to template changes
    const templateChannel = supabase
      .channel('quick_message_templates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_message_templates',
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newTemplate = payload.new as QuickMessageTemplate
            setTemplates((prev) => [...prev, newTemplate].sort((a, b) => a.order_index - b.order_index))
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTemplate = payload.new as QuickMessageTemplate
            setTemplates((prev) =>
              prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedTemplate = payload.old as QuickMessageTemplate
            setTemplates((prev) => prev.filter((t) => t.id !== deletedTemplate.id))
          }
        }
      )
      .subscribe()

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel)
      if (partnerChannel) supabase.removeChannel(partnerChannel)
      supabase.removeChannel(templateChannel)
    }
  }, [session, profile])

  return {
    messages,
    templates,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    fetchMessages,
    fetchTemplates,
    getUnreadCount,
  }
}

