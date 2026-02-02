import { WidgetSyncService } from '@/services/widget-sync'
import { useCallback, useEffect } from 'react'
import { useQuickMessages } from './use-quick-messages'
import { useSneakPeek } from './use-sneak-peek'
import { useTodos } from './use-todos'
import { usePunchCard } from './use-punch-card'

/**
 * Hook to automatically sync data to widgets
 * Deferred to avoid blocking initial render
 */
export function useWidgetSync() {
  const { todos, groups } = useTodos()
  const { templates } = useQuickMessages()
  const { sneakPeeks } = useSneakPeek()
  const { daysTogether } = usePunchCard()

  // Sync templates to widget (deferred)
  useEffect(() => {
    // Defer sync to avoid blocking initial render
    const timer = setTimeout(() => {
      if (templates && templates.length >= 0) {
        WidgetSyncService.syncMessageTemplates(templates)
      }
    }, 1000) // Wait 1 second after mount
    
    return () => clearTimeout(timer)
  }, [templates])

  // Sync todos to widget (deferred)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todos && todos.length >= 0) {
        // Get recent incomplete todos (last 10)
        const recentTodos = todos
          .filter(t => !t.completed)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(t => ({
            id: t.id,
            title: t.title,
            group_id: t.group_id,
            completed: t.completed,
          }))
        
        WidgetSyncService.syncTodos(recentTodos)
      }
    }, 1500) // Wait 1.5 seconds after mount
    
    return () => clearTimeout(timer)
  }, [todos])

  // Sync photos to widget (deferred)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sneakPeeks && sneakPeeks.length >= 0) {
        // Get recent photos (last 5) with signed URLs
        const recentPhotos = sneakPeeks
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            image_url: p.image_url,
            signedUrl: (p as any).signedUrl, // Include signed URL for widget
            caption: p.caption,
            created_at: p.created_at,
          }))
        
        WidgetSyncService.syncPhotos(recentPhotos)
      }
    }, 2000) // Wait 2 seconds after mount
    
    return () => clearTimeout(timer)
  }, [sneakPeeks])

  // Sync days together (deferred)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (daysTogether !== undefined) {
        WidgetSyncService.syncDaysTogether(daysTogether)
      }
    }, 2500) // Wait 2.5 seconds after mount
    
    return () => clearTimeout(timer)
  }, [daysTogether])
  
  // Force refresh all widgets
  const forceRefresh = useCallback(() => {
    WidgetSyncService.forceRefresh()
  }, [])
  
  return {
    forceRefresh,
  }
}














