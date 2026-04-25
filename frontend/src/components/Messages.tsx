import { useEffect, useState } from 'react'
import { apiFetch, type MessageDto, type PagedResult } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Mail, CheckCircle2, Circle } from 'lucide-react'

export default function Messages() {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<MessageDto | null>(null)

  const pageSize = 10

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      try {
        const data = await apiFetch<PagedResult<MessageDto>>(`/api/messages/inbox?page=${page}&pageSize=${pageSize}`)
        setMessages(data.items)
        setTotal(data.totalCount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [page])

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await apiFetch(`/api/messages/${messageId}/read`, { method: 'PUT' })
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead: true })
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err)
    }
  }

  if (loading && messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Messages List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Messages
            </CardTitle>
            <CardDescription>{total} total</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-accent' : ''
                    } ${!msg.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!msg.isRead ? (
                        <Circle className="w-2 h-2 mt-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{msg.flatTitle}</p>
                        <p className="text-xs text-muted-foreground">From: {msg.senderName}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > pageSize && (
              <div className="flex gap-2 mt-4 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground py-2">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                  disabled={page === Math.ceil(total / pageSize)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail */}
      <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedMessage.subject}</CardTitle>
                  <CardDescription className="mt-2">
                    From: <strong>{selectedMessage.senderName}</strong> (
                    {selectedMessage.senderEmail})
                  </CardDescription>
                  <CardDescription className="mt-1">
                    <strong>Phone:</strong> {selectedMessage.senderPhone}
                  </CardDescription>
                  <CardDescription>
                    <strong>About:</strong> {selectedMessage.flatTitle}
                  </CardDescription>
                  <CardDescription>
                    Sent: {new Date(selectedMessage.sentAt).toLocaleString()}
                  </CardDescription>
                </div>
                {!selectedMessage.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(selectedMessage.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedMessage.body}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground">Select a message to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
