import { Plus } from "lucide-react"
import { WebhooksPage } from "./WebhooksPage"


const main = () => {
  return (
     <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600">
            Configure webhooks to receive real-time notifications about events in your application
          </p>
        </div>
         {/* Right Side Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors">
          <Plus className="w-4 h-4" />
          Create Webhook
        </button>
      </div>
      </div>
      <WebhooksPage/>
      </div>
  )
}

export default main