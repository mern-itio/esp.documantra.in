interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const InlineEditor: React.FC<InlineEditorProps> = ({ value, onChange }) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className="outline-none text-sm leading-relaxed"
      onInput={(e) => onChange((e.target as HTMLElement).innerText)}
    >
      {value}
    </div>
  );
};

export default InlineEditor;
