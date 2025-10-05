export default function MessageInput({ message, setMessage, handleSendMessage, loading }) {
  return (
    <form onSubmit={handleSendMessage} className="flex space-x-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your symptoms..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!message.trim() || loading}
        className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          !message.trim() || loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Send
      </button>
    </form>
  )
}