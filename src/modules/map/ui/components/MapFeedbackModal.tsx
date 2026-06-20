import { useState } from 'react'
import { ImageIcon, MessageSquare, AlertTriangle, Send, Loader2 } from 'lucide-react'
import { AppModal } from '../../../app/ui/components/AppModal'
import { Label } from '../../../../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/Select'
import { cn } from '../../../../lib/utils'
import type { MapFeedback, MapFeedbackType } from '../../core/entities/MapFeedback.entity'
import { markerTypes, markerTypeLabels } from '../../core/entities/MapConfig.entity'

type MapFeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
  target: { x: number, y: number, pointId?: string, pointName?: string } | null
  onSubmit: (data: MapFeedback) => Promise<void>
}

export function MapFeedbackModal({ isOpen, onClose, target, onSubmit }: MapFeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<MapFeedbackType>(target?.pointId ? 'update' : 'new_point')
  const [markerType, setMarkerType] = useState<string>('')
  const [observation, setObservation] = useState('')
  const [reason, setReason] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  if (!isOpen || !target) return null

  const displayX = target.x.toFixed(2)
  const displayY = target.y.toFixed(2)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        type,
        x: target.x,
        y: target.y,
        point_id: target.pointId,
        marker_type: type === 'new_point' ? markerType : undefined,
        observation,
        reason: target.pointId ? reason : undefined,
        image
      })
      // Reset form
      setObservation('')
      setReason('')
      setImage(null)
      setImagePreview(null)
      setMarkerType('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    if (type === 'new_point' && !markerType) return false
    if (target.pointId && !reason) return false
    return true
  }

  return (
    <AppModal
      ariaLabel="Enviar feedback do mapa"
      eyebrow="Feedback"
      icon={MessageSquare}
      onClose={onClose}
      title={target.pointId ? `Relatar: ${target.pointName}` : 'Sugerir Novo Ponto'}
      widthClassName="w-[min(500px,100%)]"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-[#9a7a40] hover:bg-white/5 transition active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="feedback-form"
            disabled={isSubmitting || !isFormValid()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#c8860a] hover:bg-[#ffdd66] hover:text-[#0f0b04] text-white font-bold transition active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            Enviar Feedback
          </button>
        </div>
      }
    >
      <form id="feedback-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div>
            <Label className="text-[0.65rem] text-[#9a7a40] uppercase tracking-wider">Coordenada X</Label>
            <p className="text-lg font-mono font-bold text-white">{displayX}</p>
          </div>
          <div>
            <Label className="text-[0.65rem] text-[#9a7a40] uppercase tracking-wider">Coordenada Y</Label>
            <p className="text-lg font-mono font-bold text-white">{displayY}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo do Feedback</Label>
            <Select value={type} onValueChange={(v) => setType(v as MapFeedbackType)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_point">Novo Ponto</SelectItem>
                <SelectItem value="update">Correção de Dados</SelectItem>
                <SelectItem value="bug">Relatar Erro (Bug)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'new_point' && (
            <div className="space-y-2">
              <Label>Tipo Sugerido</Label>
              <Select value={markerType} onValueChange={setMarkerType}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione o tipo de marcador" />
                </SelectTrigger>
                <SelectContent>
                  {markerTypes.map((mt) => (
                    <SelectItem key={mt} value={mt}>
                      {markerTypeLabels[mt as keyof typeof markerTypeLabels] || mt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {target.pointId && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[#9a7a40] text-[0.65rem] font-mono font-bold uppercase tracking-wider">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Motivo da Alteração</span>
              </div>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique por que este ponto precisa ser alterado..."
                className="w-full min-h-[80px] rounded-lg bg-white/5 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-[#c8860a]/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Mais detalhes que ajudem a equipe..."
              className="w-full min-h-[100px] rounded-lg bg-white/5 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-[#c8860a]/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem / Print do Jogo (Opcional)</Label>
            <div 
              className={cn(
                "relative group cursor-pointer border-2 border-dashed border-white/10 rounded-lg p-4 transition hover:bg-white/5",
                imagePreview ? "border-[#c8860a]/30 bg-[#c8860a]/5" : ""
              )}
              onClick={() => document.getElementById('feedback-image')?.click()}
            >
              <input
                id="feedback-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              
              {imagePreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <ImageIcon className="text-white" size={32} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-[#9a7a40] gap-2">
                  <ImageIcon size={32} className="opacity-20" />
                  <span className="text-xs font-medium">Clique para selecionar imagem</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </AppModal>
  )
}
