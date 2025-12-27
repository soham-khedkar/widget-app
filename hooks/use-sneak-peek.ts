import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './use-auth-context'
import { SneakPeek } from '@/types/database'

export interface SneakPeekWithUrl extends SneakPeek {
  signedUrl?: string // Full signed URL for display
}

const PHOTOS_PER_PAGE = 10

export function useSneakPeek() {
  const { session, profile } = useAuthContext()
  const [sneakPeeks, setSneakPeeks] = useState<SneakPeekWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Get signed URL for an image
  const getSignedUrl = async (imagePath: string): Promise<string | null> => {
    try {
      const { data, error: urlError } = await supabase.storage
        .from('sneak-peeks')
        .createSignedUrl(imagePath, 3600) // 1 hour expiry

      if (urlError) {
        console.error('Error creating signed URL:', urlError)
        return null
      }

      return data?.signedUrl || null
    } catch (err) {
      console.error('Error getting signed URL:', err)
      return null
    }
  }

  // Fetch sneak peeks with pagination (both sent and received)
  const fetchSneakPeeks = async (reset = false) => {
    if (!session || !profile) return

    try {
      if (reset) {
        setLoading(true)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }
      
      const offset = reset ? 0 : sneakPeeks.length
      
      // Fetch sneak peeks where user is sender or receiver
      const { data, error: fetchError } = await supabase
        .from('sneak_peeks')
        .select('*')
        .or(`user_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + PHOTOS_PER_PAGE - 1)

      if (fetchError) throw fetchError

      // Check if there are more photos
      const fetchedCount = (data || []).length
      setHasMore(fetchedCount === PHOTOS_PER_PAGE)

      // Get signed URLs for all images
      const sneakPeeksWithUrls = await Promise.all(
        (data || []).map(async (peek) => {
          const signedUrl = await getSignedUrl(peek.image_url)
          return { ...peek, signedUrl: signedUrl || undefined }
        })
      )

      if (reset) {
        setSneakPeeks(sneakPeeksWithUrls)
      } else {
        // Filter out duplicates (in case real-time updates added some)
        setSneakPeeks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const newItems = sneakPeeksWithUrls.filter((p) => !existingIds.has(p.id))
          return [...prev, ...newItems]
        })
      }
      setError(null)
    } catch (err: any) {
      console.error('Error fetching sneak peeks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more photos (pagination)
  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await fetchSneakPeeks(false)
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (uri: string, fileName: string): Promise<string | null> => {
    if (!session) return null

    try {
      // Create file path: {user_id}/{timestamp}_{filename}
      const timestamp = Date.now()
      const filePath = `${session.user.id}/${timestamp}_${fileName}`

      // Get current session for auth token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        console.error('No session found')
        return null
      }

      // Use FormData with file URI (React Native compatible)
      const formData = new FormData()
      // @ts-ignore - React Native FormData accepts file objects with uri
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: fileName,
      } as any)

      // Use Supabase REST API with FormData
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      const uploadUrl = `${supabaseUrl}/storage/v1/object/sneak-peeks/${filePath}`
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'x-upsert': 'false',
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error uploading image:', errorText)
        return null
      }

      return filePath
    } catch (err) {
      console.error('Error uploading image:', err)
      return null
    }
  }

  // Create a new sneak peek
  const createSneakPeek = async (imageUri: string, caption?: string) => {
    if (!session || !profile) return { error: 'Not authenticated' }

    try {
      setUploading(true)

      // Generate filename
      const fileName = `sneak_${Date.now()}.jpg`

      // Upload image
      const imagePath = await uploadImage(imageUri, fileName)
      if (!imagePath) {
        return { error: 'Failed to upload image' }
      }

      // Create sneak peek record
      const { data, error: createError } = await supabase
        .from('sneak_peeks')
        .insert({
          user_id: session.user.id,
          partner_id: profile.partner_id,
          image_url: imagePath,
          caption: caption || null,
          created_by: session.user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      // Get signed URL for the new image
      const signedUrl = await getSignedUrl(imagePath)
      const newPeek = { ...data, signedUrl: signedUrl || undefined }

      setSneakPeeks((prev) => [newPeek, ...prev])
      return { data: newPeek, error: null }
    } catch (err: any) {
      console.error('Error creating sneak peek:', err)
      return { data: null, error: err.message }
    } finally {
      setUploading(false)
    }
  }

  // Mark sneak peek as viewed
  const markAsViewed = async (peekId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('sneak_peeks')
        .update({
          viewed: true,
          viewed_at: new Date().toISOString(),
        })
        .eq('id', peekId)
        .select()
        .single()

      if (updateError) throw updateError

      setSneakPeeks((prev) =>
        prev.map((p) => (p.id === peekId ? { ...p, ...data } : p))
      )
      return { data, error: null }
    } catch (err: any) {
      console.error('Error marking sneak peek as viewed:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete a sneak peek
  const deleteSneakPeek = async (peekId: string) => {
    if (!session) return { error: 'Not authenticated' }

    try {
      // Get the sneak peek to find image path
      const peek = sneakPeeks.find((p) => p.id === peekId)
      if (!peek) return { error: 'Sneak peek not found' }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('sneak_peeks')
        .delete()
        .eq('id', peekId)

      if (deleteError) throw deleteError

      // Delete image from storage
      if (peek.image_url) {
        await supabase.storage
          .from('sneak-peeks')
          .remove([peek.image_url])
      }

      setSneakPeeks((prev) => prev.filter((p) => p.id !== peekId))
      return { error: null }
    } catch (err: any) {
      console.error('Error deleting sneak peek:', err)
      return { error: err.message }
    }
  }

  // Get unviewed count (for widget support)
  const getUnviewedCount = () => {
    if (!session) return 0
    return sneakPeeks.filter(
      (p) => !p.viewed && p.partner_id === session.user.id
    ).length
  }

  // Get latest sneak peek (for widget support)
  const getLatestSneakPeek = () => {
    if (!session) return null
    const received = sneakPeeks.filter((p) => p.partner_id === session.user.id)
    return received.length > 0 ? received[0] : null
  }

  // Real-time subscription
  useEffect(() => {
    if (!session || !profile) {
      setLoading(false)
      setSneakPeeks([])
      return
    }

    // Initial fetch
    fetchSneakPeeks(true)

    // Subscribe to real-time changes
    const channel = supabase
      .channel('sneak_peeks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sneak_peeks',
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPeek = payload.new as SneakPeek
            const signedUrl = await getSignedUrl(newPeek.image_url)
            setSneakPeeks((prev) => [
              { ...newPeek, signedUrl: signedUrl || undefined },
              ...prev,
            ])
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPeek = payload.new as SneakPeek
            setSneakPeeks((prev) =>
              prev.map((p) =>
                p.id === updatedPeek.id
                  ? { ...p, ...updatedPeek }
                  : p
              )
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedPeek = payload.old as SneakPeek
            setSneakPeeks((prev) => prev.filter((p) => p.id !== deletedPeek.id))
          }
        }
      )
      .subscribe()

    // Also listen for partner's sneak peeks
    if (profile.partner_id) {
      const partnerChannel = supabase
        .channel('partner_sneak_peeks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sneak_peeks',
            filter: `partner_id=eq.${session.user.id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newPeek = payload.new as SneakPeek
              const signedUrl = await getSignedUrl(newPeek.image_url)
              setSneakPeeks((prev) => [
                { ...newPeek, signedUrl: signedUrl || undefined },
                ...prev,
              ])
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedPeek = payload.new as SneakPeek
              setSneakPeeks((prev) =>
                prev.map((p) =>
                  p.id === updatedPeek.id
                    ? { ...p, ...updatedPeek }
                    : p
                )
              )
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(partnerChannel)
      }
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, profile])

  return {
    sneakPeeks,
    loading,
    error,
    uploading,
    fetchSneakPeeks,
    createSneakPeek,
    markAsViewed,
    deleteSneakPeek,
    getUnviewedCount,
    getLatestSneakPeek,
    loadMore,
    hasMore,
    loadingMore,
  }
}

