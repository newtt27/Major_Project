// index.ts (không cần nếu dùng server.ts)
import { createApp } from "./app"
import { setupChatHandler } from "./websocket/chat.handler"
import { startScheduler } from "./utils/scheduler"

const { server } = createApp()
setupChatHandler(server)
startScheduler()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})