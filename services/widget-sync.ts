/**
 * Widget Sync Service
 * Syncs app data to widgets using react-native-android-widget
 */

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { requestWidgetUpdate } from 'react-native-android-widget'
import React from 'react'
import { TruLuvWidget } from '@/widgets/TruLuvWidget'

const WIDGET_DATA_KEY = 'TruLuvWidgetData'

interface WidgetData {
  messageTemplates: Array<{ id: string; text: string; emoji: string | null }>
  todos: Array<{ id: string; title: string; completed: boolean; groupTitle: string }>
  sneakPeeks: Array<{ id: string; imageUrl: string; caption: string | null }>
  daysTogether: number
  currentPage?: number
}

/**
 * Widget Sync Service class
 * Handles syncing app data to widgets using react-native-android-widget
 */
export class WidgetSyncService {
  private static isAvailable = (): boolean => {
    return Platform.OS === 'android'
  }

  /**
   * Get current widget data from storage
   */
  private static async getWidgetData(): Promise<WidgetData> {
    try {
      const dataStr = await AsyncStorage.getItem(WIDGET_DATA_KEY)
      if (dataStr) {
        return JSON.parse(dataStr)
      }
    } catch (error) {
      console.error('Error reading widget data:', error)
    }
    return {
      messageTemplates: [],
      todos: [],
      sneakPeeks: [],
      daysTogether: 0,
    }
  }

  /**
   * Save widget data to storage
   */
  private static async saveWidgetData(data: Partial<WidgetData>) {
    try {
      const current = await this.getWidgetData()
      const updated = { ...current, ...data }
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      console.error('Error saving widget data:', error)
    }
  }

  /**
   * Update widget with latest data
   */
  private static async updateWidget() {
    if (!this.isAvailable()) return

    try {
      const data = await this.getWidgetData()
      
      await requestWidgetUpdate({
        widgetName: 'TruLuvWidget',
        renderWidget: () => React.createElement(TruLuvWidget, { data }),
      })
    } catch (error) {
      console.error('Error updating widget:', error)
    }
  }
  
  /**
   * Sync message templates to widget
   */
  static async syncMessageTemplates(templates: any[]) {
    if (!this.isAvailable()) return

    try {
      const formattedTemplates = templates.slice(0, 6).map((t) => ({
        id: t.id,
        text: t.text,
        emoji: t.emoji || null,
      }))
      
      await this.saveWidgetData({ messageTemplates: formattedTemplates })
      await this.updateWidget()
    } catch (error) {
      console.error('Error syncing message templates:', error)
    }
  }

  /**
   * Sync recent todos to widget
   */
  static async syncTodos(todos: any[]) {
    if (!this.isAvailable()) return

    try {
      const formattedTodos = todos.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        groupTitle: t.groupTitle || 'Todos',
      }))
      
      await this.saveWidgetData({ todos: formattedTodos })
      await this.updateWidget()
    } catch (error) {
      console.error('Error syncing todos:', error)
    }
  }

  /**
   * Sync recent photos to widget
   */
  static async syncPhotos(photos: any[]) {
    if (!this.isAvailable()) return

    try {
      const formattedPhotos = photos.slice(0, 4).map((p) => ({
        id: p.id,
        imageUrl: p.signedUrl || p.imageUrl || p.image_url, // Prefer signedUrl for widget
        caption: p.caption || null,
      }))
      
      await this.saveWidgetData({ sneakPeeks: formattedPhotos })
      await this.updateWidget()
    } catch (error) {
      console.error('Error syncing photos:', error)
    }
  }
  
  /**
   * Sync days together to widget
   */
  static async syncDaysTogether(days: number) {
    if (!this.isAvailable()) return

    try {
      await this.saveWidgetData({ daysTogether: days })
      await this.updateWidget()
    } catch (error) {
      console.error('Error syncing days together:', error)
    }
  }
  
  /**
   * Sync all data at once
   */
  static async syncAll(data: {
    templates?: any[]
    todos?: any[]
    photos?: any[]
    daysTogether?: number
  }) {
    if (!this.isAvailable()) return

    try {
      const widgetData: Partial<WidgetData> = {}
      
      if (data.templates) {
        widgetData.messageTemplates = data.templates.slice(0, 6).map((t) => ({
          id: t.id,
          text: t.text,
          emoji: t.emoji || null,
        }))
      }
      if (data.todos) {
        widgetData.todos = data.todos.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed || false,
          groupTitle: t.groupTitle || 'Todos',
        }))
      }
      if (data.photos) {
        widgetData.sneakPeeks = data.photos.slice(0, 4).map((p) => ({
          id: p.id,
          imageUrl: p.image_url || p.imageUrl,
          caption: p.caption || null,
        }))
      }
      if (data.daysTogether !== undefined) {
        widgetData.daysTogether = data.daysTogether
      }
      
      await this.saveWidgetData(widgetData)
      await this.updateWidget()
    } catch (error) {
      console.error('Error syncing all data:', error)
    }
  }
  
  /**
   * Force refresh all widgets
   */
  static async forceRefresh() {
    if (!this.isAvailable()) return
    
    try {
      await this.updateWidget()
    } catch (error) {
      console.error('Error refreshing widgets:', error)
    }
  }
}

