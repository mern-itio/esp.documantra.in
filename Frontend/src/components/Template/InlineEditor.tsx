import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface Props {
  value: string;      
  onChange: (html: string) => void;
}

const InlineEditor: React.FC<Props> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

useEffect(() => {
  if (editor && value !== editor.getHTML()) {
    editor.commands.setContent(value);
  }
}, [value, editor]);


  if (!editor) return null;

  return (
    <div className="p-3">
      <EditorContent editor={editor} />
    </div>
  );
};

export default InlineEditor;
