import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { sendMessage } from '../store/slices/chatSlice'

export default function ImageUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const dispatch = useDispatch()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = () => {
    if (file) {
      const formData = new FormData()
      formData.append('image', file)
      dispatch(sendMessage(formData))
      setFile(null)
      setPreview(null)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />
      {preview && (
        <div className="mb-2">
          <img src={preview} alt="Preview" className="max-w-xs max-h-40" />
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={!file}
        className={`px-3 py-1 text-sm text-white bg-indigo-600 rounded-md ${
          !file ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
        }`}
      >
        Upload Image
      </button>
    </div>
  )
}