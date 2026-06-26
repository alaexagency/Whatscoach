import { useState, useRef } from 'react'

export interface KBFragment {
  id: string
  fileName: string
  text: string
  wordCount: number
  addedAt: string
}

export function useKnowledgeBase(onNotify: (msg: string, isError?: boolean) => void) {
  const [knowledgeSources, setKnowledgeSources] = useState<KBFragment[]>([])
  const [pastedKbText, setPastedKbText] = useState('')
  const [isKbOpen, setIsKbOpen] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addTextFragment() {
    const text = pastedKbText.trim()
    if (!text) {
      onNotify('Por favor, introduce o pega algo de texto primero.', true)
      return
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const fragment: KBFragment = {
      id: Date.now().toString(),
      fileName: `Fragmento de Manual (${wordCount} pal.)`,
      text,
      wordCount,
      addedAt: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    }
    setKnowledgeSources(prev => [...prev, fragment])
    setPastedKbText('')
    onNotify('Fragmento de conocimiento cargado exitosamente.')
  }

  function removeKbFragment(id: string) {
    setKnowledgeSources(prev => prev.filter(k => k.id !== id))
    onNotify('Fragmento removido de la Base de Conocimiento.')
  }

  async function handlePdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      onNotify('Por favor, sube únicamente un archivo PDF válido.', true)
      return
    }

    setIsPdfLoading(true)
    const pdfjsLib = (window as any).pdfjsLib

    if (!pdfjsLib) {
      onNotify('El procesador de PDF aún se está descargando. Inténtalo de nuevo.', true)
      setIsPdfLoading(false)
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer)
          const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise
          let extractedText = ''

          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum)
            const content = await page.getTextContent()
            const pageStrings = content.items.map((item: any) => item.str)
            extractedText += pageStrings.join(' ') + '\n'
          }

          const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length
          if (wordCount < 10) {
            throw new Error('No pudimos extraer texto legible de este PDF. Asegúrate de que no contenga solo imágenes escaneadas.')
          }

          const fragment: KBFragment = {
            id: Date.now().toString(),
            fileName: file.name,
            text: extractedText,
            wordCount,
            addedAt: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
          }
          setKnowledgeSources(prev => [...prev, fragment])
          onNotify(`¡Éxito! Se han extraído ${wordCount} palabras de "${file.name}"`)
        } catch (err: any) {
          onNotify(err.message || 'Falla al parsear las páginas del PDF.', true)
        } finally {
          setIsPdfLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error(err)
      onNotify('Ocurrió un error leyendo el archivo seleccionado.', true)
      setIsPdfLoading(false)
    }
  }

  return {
    knowledgeSources,
    pastedKbText,
    setPastedKbText,
    isKbOpen,
    setIsKbOpen,
    isPdfLoading,
    fileInputRef,
    addTextFragment,
    removeKbFragment,
    handlePdfUpload,
    cleanPastedKbInput: () => setPastedKbText(''),
  }
}
