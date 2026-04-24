import { defineEventHandler, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path')
  const method = event.method
  
  // Only read body for non-GET requests
  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) 
    ? await readBody(event).catch(() => undefined) 
    : undefined

  // Basic Auth Header
  const auth = btoa(`${config.freqtradeUser}:${config.freqtradePass}`)

  try {
    return await $fetch(`${config.freqtradeUrl}/api/v1/${path}`, {
      method,
      body,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    console.error(`Freqtrade Proxy Error (${path}):`, error.message)
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: `Freqtrade API Error: ${error.message}`
    })
  }
})

