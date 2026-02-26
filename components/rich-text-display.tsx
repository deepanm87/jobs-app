interface RichTextDisplayProps {
  content: string
  className?: string
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  return (
    <div 
      className={`prose-job text-sm leading-relaxed text-foreground/80 ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}