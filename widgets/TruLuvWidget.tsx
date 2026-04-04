"use no memo";

/**
 * TruLuv Main Widget
 * A comprehensive widget with navigation between Messages, Todos, and Sneak Peek
 * 
 * Note: Widgets cannot use React hooks directly. Data must be synced via AsyncStorage
 * and read here using the widget's data access methods.
 */

import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

export interface WidgetData {
  currentPage?: number
  messageTemplates: { id: string; text: string; emoji: string | null }[]
  todos: { id: string; title: string; completed: boolean; groupTitle: string }[]
  sneakPeeks: { id: string; imageUrl: string; caption: string | null }[]
  daysTogether: number
  currentPhotoIndex?: number
}

const PAGES = ['messages', 'todos', 'sneak-peek', 'punch-card'] as const

// Default data when nothing is synced yet
const defaultData: WidgetData = {
  currentPage: 0,
  messageTemplates: [],
  todos: [],
  sneakPeeks: [],
  daysTogether: 0,
}

interface TruLuvWidgetProps {
  data?: WidgetData
}

export function TruLuvWidget({ data }: TruLuvWidgetProps = {}) {
  // Use provided data or default
  const widgetData: WidgetData = data || defaultData

  const renderPage = (pageIndex: number = 0) => {
    const page = PAGES[pageIndex] || PAGES[0]

    switch (page) {
      case 'messages':
        return renderMessagesPage(widgetData.messageTemplates)
      case 'todos':
        return renderTodosPage(widgetData.todos)
      case 'sneak-peek':
        return renderSneakPeekPage(widgetData.sneakPeeks, widgetData.currentPhotoIndex)
      case 'punch-card':
        return renderPunchCardPage(widgetData.daysTogether)
      default:
        return renderMessagesPage(widgetData.messageTemplates)
    }
  }

  // Standardized page dimensions
  const PAGE_HEADER_HEIGHT = 44
  const PAGE_CONTENT_PADDING = 12
  const PAGE_MIN_HEIGHT = 200

  const renderMessagesPage = (templates: WidgetData['messageTemplates']) => {
    const displayTemplates = templates.slice(0, 5) // Limit to 5 for consistent sizing

    return (
      <FlexWidget
        style={{
          flexDirection: 'column',
          padding: 0,
          backgroundColor: '#FFF9E6', // Cream/yellow note background
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: PAGE_MIN_HEIGHT,
        }}
      >
        {/* Header */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#8B4513', // Brown header
            padding: 12,
            paddingHorizontal: 14,
            height: PAGE_HEADER_HEIGHT,
          }}
        >
          <TextWidget
            text="💕 Messages"
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
        
        <FlexWidget style={{ padding: PAGE_CONTENT_PADDING, flex: 1 }}>
          {/* Message Templates */}
          {displayTemplates.length === 0 ? (
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              marginTop: 8,
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'truluv://messages' }}
          >
            <TextWidget
              text="💬"
              style={{
                fontSize: 32,
                marginBottom: 12,
              }}
            />
            <TextWidget
              text="No messages yet"
              style={{
                fontSize: 16,
                color: '#333333',
                marginBottom: 4,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Tap to create"
              style={{
                fontSize: 12,
                color: '#999999',
              }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{
              flexDirection: 'column',
              flexGap: 8,
            }}
          >
            {displayTemplates.map((template, index) => (
              <FlexWidget
                key={template.id || index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 6,
                }}
                clickAction="SEND_MESSAGE"
                clickActionData={{ templateId: template.id, text: template.text }}
              >
                {template.emoji && (
                  <TextWidget
                    text={template.emoji}
                    style={{
                      fontSize: 20,
                      marginRight: 8,
                    }}
                  />
                )}
                <FlexWidget style={{ flex: 1 }}>
                  <TextWidget
                    text={template.text}
                    style={{
                      fontSize: 14,
                      color: '#000000',
                    }}
                  />
                </FlexWidget>
              </FlexWidget>
            ))}
          </FlexWidget>
          )}
        </FlexWidget>
      </FlexWidget>
    )
  }

  const renderTodosPage = (todos: WidgetData['todos']) => {
    const displayTodos = todos.slice(0, 5) // Limit to 5 for consistent sizing

    return (
      <FlexWidget
        style={{
          flexDirection: 'column',
          padding: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: PAGE_MIN_HEIGHT,
        }}
      >
        {/* Header */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#6BFFB8',
            padding: 12,
            paddingHorizontal: 14,
            height: PAGE_HEADER_HEIGHT,
          }}
        >
          <TextWidget
            text="✅ Todos"
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#333333',
            }}
          />
          <TextWidget
            text={`${todos.length}`}
            style={{
              fontSize: 12,
              color: '#666666',
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ padding: PAGE_CONTENT_PADDING, flex: 1 }}>

        {/* Todo List */}
        {displayTodos.length === 0 ? (
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'truluv://todos' }}
          >
            <TextWidget
              text="📝"
              style={{
                fontSize: 32,
                marginBottom: 12,
              }}
            />
            <TextWidget
              text="No todos yet"
              style={{
                fontSize: 14,
                color: '#333333',
                marginBottom: 4,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Tap to create"
              style={{
                fontSize: 12,
                color: '#666666',
              }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{
              flexDirection: 'column',
              flexGap: 6,
            }}
          >
            {displayTodos.map((todo, index) => (
              <FlexWidget
                key={todo.id || index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: '#F9F9F9',
                  borderRadius: 6,
                }}
              >
                <TextWidget
                  text={todo.completed ? '✓' : '○'}
                  style={{
                    fontSize: 18,
                    color: todo.completed ? '#4CAF50' : '#CCCCCC',
                    marginRight: 8,
                    width: 22,
                  }}
                  clickAction="TOGGLE_TODO"
                  clickActionData={{ todoId: todo.id }}
                />
                <FlexWidget style={{ flex: 1 }}>
                  <TextWidget
                    text={todo.title}
                    style={{
                      fontSize: 13,
                      color: todo.completed ? '#999999' : '#000000',
                    }}
                  />
                </FlexWidget>
              </FlexWidget>
            ))}
          </FlexWidget>
        )}
        </FlexWidget>
      </FlexWidget>
    )
  }

  const renderSneakPeekPage = (sneakPeeks: WidgetData['sneakPeeks'], currentPhotoIndex?: number) => {
    const photoIndex = currentPhotoIndex !== undefined ? currentPhotoIndex : (widgetData.currentPhotoIndex || 0)
    const currentPhoto = sneakPeeks[photoIndex] || sneakPeeks[0]

    return (
      <FlexWidget
        style={{
          flexDirection: 'column',
          padding: 0,
          backgroundColor: '#000000',
          minHeight: PAGE_MIN_HEIGHT,
        }}
      >
        {/* Header */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            paddingHorizontal: 14,
            backgroundColor: '#1A1A1A',
            height: PAGE_HEADER_HEIGHT,
          }}
        >
          <TextWidget
            text="📸 Sneak Peek"
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
          <TextWidget
            text={sneakPeeks.length > 0 ? `${photoIndex + 1}/${sneakPeeks.length}` : '0'}
            style={{
              fontSize: 12,
              color: '#CCCCCC',
            }}
          />
        </FlexWidget>

        {/* Main Photo Display */}
        {sneakPeeks.length === 0 ? (
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: 'truluv://sneak-peek' }}
          >
            <TextWidget
              text="📷"
              style={{
                fontSize: 48,
                marginBottom: 16,
              }}
            />
            <TextWidget
              text="No photos yet"
              style={{
                fontSize: 16,
                color: '#FFFFFF',
                marginBottom: 8,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text="Tap to add your first photo"
              style={{
                fontSize: 14,
                color: '#CCCCCC',
              }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: PAGE_CONTENT_PADDING,
              flex: 1,
            }}
          >
            {/* Previous Photo Button */}
            {sneakPeeks.length > 1 && photoIndex > 0 && (
              <TextWidget
                text="◀"
                style={{
                  fontSize: 24,
                  color: '#FFFFFF',
                  padding: 8,
                  backgroundColor: '#00000080',
                  borderRadius: 20,
                }}
                clickAction="CHANGE_PHOTO"
                clickActionData={{ direction: 'prev' }}
              />
            )}

            {/* Main Photo */}
            <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, paddingVertical: 12 }}>
              {currentPhoto.imageUrl ? (
                <ImageWidget
                  image={currentPhoto.imageUrl as `https:${string}`}
                  imageWidth={160}
                  imageHeight={160}
                  radius={12}
                  clickAction="VIEW_PHOTO"
                  clickActionData={{ photoId: currentPhoto.id, photoIndex }}
                />
              ) : (
                <TextWidget
                  text="📷"
                  style={{
                    fontSize: 48,
                    color: '#FFFFFF',
                  }}
                />
              )}
              {currentPhoto.caption && (
                <TextWidget
                  text={currentPhoto.caption}
                  style={{
                    fontSize: 11,
                    color: '#CCCCCC',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                />
              )}
            </FlexWidget>

            {/* Next Photo Button */}
            {sneakPeeks.length > 1 && photoIndex < sneakPeeks.length - 1 && (
              <TextWidget
                text="▶"
                style={{
                  fontSize: 24,
                  color: '#FFFFFF',
                  padding: 8,
                  backgroundColor: '#00000080',
                  borderRadius: 20,
                }}
                clickAction="CHANGE_PHOTO"
                clickActionData={{ direction: 'next' }}
              />
            )}
          </FlexWidget>
        )}
      </FlexWidget>
    )
  }

  const renderPunchCardPage = (daysTogether: number) => {
    return (
      <FlexWidget
        style={{
          flexDirection: 'column',
          padding: 0,
          backgroundColor: '#F5F5F5',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: PAGE_MIN_HEIGHT,
        }}
      >
        {/* Header */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FF6B9D',
            padding: 12,
            paddingHorizontal: 14,
            height: PAGE_HEADER_HEIGHT,
          }}
        >
          <TextWidget
            text="💕 Days Together"
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>

        {/* Content */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: PAGE_CONTENT_PADDING,
            flex: 1,
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'truluv://' }}
        >
          <TextWidget
            text={String(daysTogether || 0)}
            style={{
              fontSize: 42,
              fontWeight: 'bold',
              color: '#FF6B9D',
            }}
          />
          <TextWidget
            text="days"
            style={{
              fontSize: 14,
              color: '#666666',
              marginTop: 4,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    )
  }

  const currentPage = widgetData.currentPage || 0

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Main Content */}
      {renderPage(currentPage)}

      {/* Navigation with Arrows and Dots */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
          paddingHorizontal: 12,
          backgroundColor: '#F5F5F5',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        }}
      >
        {/* Previous Button */}
        <TextWidget
          text="◀"
          style={{
            fontSize: 20,
            color: currentPage > 0 ? '#FF6B9D' : '#CCCCCC',
            width: 32,
            textAlign: 'center',
          }}
          clickAction={currentPage > 0 ? 'CHANGE_PAGE' : undefined}
          clickActionData={currentPage > 0 ? { pageIndex: currentPage - 1 } : undefined}
        />

        {/* Dots Indicator */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            flexGap: 6,
            alignItems: 'center',
            paddingHorizontal: 8,
          }}
        >
          {PAGES.map((_, index) => (
            <TextWidget
              key={index}
              text={currentPage === index ? '●' : '○'}
              style={{
                fontSize: 12,
                color: currentPage === index ? '#FF6B9D' : '#CCCCCC',
              }}
              clickAction="CHANGE_PAGE"
              clickActionData={{ pageIndex: index }}
            />
          ))}
        </FlexWidget>

        {/* Next Button */}
        <TextWidget
          text="▶"
          style={{
            fontSize: 20,
            color: currentPage < PAGES.length - 1 ? '#FF6B9D' : '#CCCCCC',
            width: 32,
            textAlign: 'center',
          }}
          clickAction={currentPage < PAGES.length - 1 ? 'CHANGE_PAGE' : undefined}
          clickActionData={currentPage < PAGES.length - 1 ? { pageIndex: currentPage + 1 } : undefined}
        />
      </FlexWidget>
    </FlexWidget>
  )
}
