/**
 * Widget Registration
 * Registers the TruLuv widget with react-native-android-widget
 */

import React from 'react'
import { Platform, Linking } from 'react-native'
import { registerWidgetTaskHandler, registerWidgetConfigurationScreen } from 'react-native-android-widget'
import { TruLuvWidget } from './TruLuvWidget'
import AsyncStorage from '@react-native-async-storage/async-storage'

const WIDGET_DATA_KEY = 'TruLuvWidgetData'

interface WidgetData {
  messageTemplates: Array<{ id: string; text: string; emoji: string | null }>
  todos: Array<{ id: string; title: string; completed: boolean; groupTitle: string }>
  sneakPeeks: Array<{ id: string; imageUrl: string; caption: string | null }>
  daysTogether: number
  currentPage?: number
  currentPhotoIndex?: number
}

// Default data
const defaultData: WidgetData = {
  messageTemplates: [],
  todos: [],
  sneakPeeks: [],
  daysTogether: 0,
  currentPage: 0,
}

// Get widget data from storage
async function getWidgetData(): Promise<WidgetData> {
  try {
    const dataStr = await AsyncStorage.getItem(WIDGET_DATA_KEY)
    if (dataStr) {
      return JSON.parse(dataStr)
    }
  } catch (error) {
    console.error('Error reading widget data:', error)
  }
  return defaultData
}

// Only register on Android and wrap in try-catch to prevent crashes
// Use a function to defer execution until React Native is ready
const registerWidgets = () => {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    // Register widget task handler
    registerWidgetTaskHandler(async (props) => {
      try {
        const { widgetInfo, widgetAction, clickAction, clickActionData, renderWidget } = props

        // Only handle TruLuvWidget
        if (widgetInfo.widgetName !== 'TruLuvWidget') {
          return
        }

        // Get current widget data
        const widgetData = await getWidgetData()

        if (widgetAction === 'WIDGET_CLICK' && clickAction) {
          // Handle custom actions
          if (clickAction === 'CHANGE_PAGE' && clickActionData?.pageIndex !== undefined) {
            // Update current page in storage
            const updatedData = { ...widgetData, currentPage: clickActionData.pageIndex as number }
            await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updatedData))
            renderWidget(<TruLuvWidget data={updatedData} />)
            return
          }

          // Handle todo toggle - update widget data immediately
          if (clickAction === 'TOGGLE_TODO' && clickActionData?.todoId) {
            const todoId = clickActionData.todoId as string
            const updatedTodos = widgetData.todos.map((todo) =>
              todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
            )
            
            // Update widget data with toggled todo
            const updatedData = { ...widgetData, todos: updatedTodos }
            await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updatedData))
            
            // Store pending action for app to sync to Supabase when it opens
            try {
              const pendingActions = await AsyncStorage.getItem('TruLuvWidgetPendingActions')
              const actions = pendingActions ? JSON.parse(pendingActions) : []
              actions.push({ type: 'TOGGLE_TODO', todoId, timestamp: Date.now() })
              await AsyncStorage.setItem('TruLuvWidgetPendingActions', JSON.stringify(actions))
            } catch (error) {
              console.error('Error storing pending action:', error)
            }
            
            // Re-render widget with updated state
            renderWidget(<TruLuvWidget data={updatedData} />)
            return
          }

          // Handle send message - store pending action
          if (clickAction === 'SEND_MESSAGE' && clickActionData?.templateId && clickActionData?.text) {
            try {
              const pendingActions = await AsyncStorage.getItem('TruLuvWidgetPendingActions')
              const actions = pendingActions ? JSON.parse(pendingActions) : []
              actions.push({
                type: 'SEND_MESSAGE',
                templateId: clickActionData.templateId,
                text: clickActionData.text,
                timestamp: Date.now(),
              })
              await AsyncStorage.setItem('TruLuvWidgetPendingActions', JSON.stringify(actions))
            } catch (error) {
              console.error('Error storing pending message action:', error)
            }
            
            // Open app to messages screen
            try {
              await Linking.openURL('truluv://messages')
            } catch (error) {
              console.error('Error opening deep link:', error)
            }
            return
          }

          // Handle view photo - navigate to sneak peek with specific photo
          if (clickAction === 'VIEW_PHOTO' && clickActionData?.photoId) {
            try {
              await Linking.openURL(`truluv://sneak-peek?id=${clickActionData.photoId}`)
            } catch (error) {
              console.error('Error opening photo deep link:', error)
            }
            return
          }

          // Handle change photo in sneak peek slideshow
          if (clickAction === 'CHANGE_PHOTO' && clickActionData?.direction) {
            const direction = clickActionData.direction as 'prev' | 'next'
            const currentPhotoIndex = widgetData.currentPhotoIndex || 0
            let newPhotoIndex = currentPhotoIndex

            if (direction === 'prev' && currentPhotoIndex > 0) {
              newPhotoIndex = currentPhotoIndex - 1
            } else if (direction === 'next' && currentPhotoIndex < widgetData.sneakPeeks.length - 1) {
              newPhotoIndex = currentPhotoIndex + 1
            }

            const updatedData = { ...widgetData, currentPhotoIndex: newPhotoIndex }
            await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updatedData))
            renderWidget(<TruLuvWidget data={updatedData} />)
            return
          }
        }

        // Render the widget with current data
        renderWidget(<TruLuvWidget data={widgetData} />)
      } catch (error) {
        console.error('Error in widget task handler:', error)
        // Try to render with default data on error
        try {
          const widgetData = await getWidgetData()
          renderWidget(<TruLuvWidget data={widgetData} />)
        } catch (renderError) {
          console.error('Error rendering widget fallback:', renderError)
        }
      }
    })

    // Register widget configuration screen
    registerWidgetConfigurationScreen(async ({ widgetInfo, renderWidget, setResult }) => {
      try {
        // Get widget data for configuration
        const widgetData = await getWidgetData()
        renderWidget(<TruLuvWidget data={widgetData} />)
        setResult('ok')
      } catch (error) {
        console.error('Error in widget configuration screen:', error)
        try {
          renderWidget(<TruLuvWidget data={defaultData} />)
          setResult('ok')
        } catch (renderError) {
          console.error('Error rendering widget in config screen:', renderError)
          setResult('error')
        }
      }
    })
  } catch (error) {
    console.error('Error registering widget:', error)
    // Don't crash the app if widget registration fails
  }
}

// Export the registration function to be called after React context is ready
export default registerWidgets
