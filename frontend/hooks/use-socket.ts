'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (tenantId?: string) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!tenantId) return

    // Connect to the socket server
    socketRef.current = io('http://localhost:5000', {
      query: { tenantId }
    })

    // Listen for stock updates
    socketRef.current.on('stockUpdate', (data: { productId: string; newStock: number }) => {
      console.log('Stock update received:', data)
      // This will be handled by the component using this hook
    })

    // Listen for sale updates
    socketRef.current.on('saleCreated', (data: any) => {
      console.log('Sale created:', data)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [tenantId])

  const emitSale = (saleData: any) => {
    if (socketRef.current) {
      socketRef.current.emit('createSale', saleData)
    }
  }

  return {
    socket: socketRef.current,
    emitSale
  }
}
