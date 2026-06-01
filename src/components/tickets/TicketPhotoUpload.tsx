'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TicketPhotoUploadProps {
  ticketId: string
  onSuccess?: () => void
}

export function TicketPhotoUpload({ ticketId, onSuccess }: TicketPhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files).slice(0, 5 - files.length)
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)

    // Crear previews
    selectedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    try {
      setIsUploading(true)

      // Crear un mensaje con las fotos como notas
      const fileData = await Promise.all(
        files.map(async (file) => {
          return {
            name: file.name,
            size: file.size,
            type: file.type,
          }
        })
      )

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📷 Se agregaron ${files.length} foto(s)`,
          isInternal: true,
          attachments: fileData.map((f) => f.name),
        }),
      })

      if (!response.ok) {
        throw new Error('Error al subir fotos')
      }

      toast.success(`${files.length} foto(s) agregada(s)`)
      setFiles([])
      setPreviews([])
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir fotos')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="h-8 w-8 text-slate-400 mb-2" />
          <span className="text-sm font-medium text-slate-600">Haz clic o arrastra fotos</span>
          <span className="text-xs text-slate-400 mt-1">Máximo 5 archivos, 10MB c/u</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || files.length >= 5}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Archivos seleccionados ({files.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${idx}`}
                  className="w-full h-24 object-cover rounded border border-slate-200"
                />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="w-full mt-3"
          >
            {isUploading ? 'Subiendo...' : `Agregar ${files.length} foto(s)`}
          </Button>
        </div>
      )}
    </div>
  )
}
