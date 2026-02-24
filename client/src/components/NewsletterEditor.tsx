import { useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface NewsletterEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function NewsletterEditor({ value, onChange }: NewsletterEditorProps) {
  const [instanceKey, setInstanceKey] = useState(0);
  const editorRef = useRef<{ setData: (data: string) => void } | null>(null);

  return (
    <div className="rounded-lg border bg-white newsletter-ck-editor">
      <CKEditor
        key={instanceKey}
        editor={ClassicEditor}
        data={value || ""}
        config={{
          placeholder: "Write your newsletter content...",
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "|",
            "blockQuote",
            "insertTable",
            "undo",
            "redo",
          ],
          link: {
            defaultProtocol: "https://",
            addTargetToExternalLinks: true,
          },
        }}
        onChange={(_, editor) => {
          onChange(editor.getData());
        }}
        onReady={(editor) => {
          editorRef.current = editor;
          editor.editing.view.change((writer) => {
            writer.setStyle(
              "min-height",
              "260px",
              editor.editing.view.document.getRoot()
            );
          });
        }}
      />
      <div className="flex justify-end border-t bg-slate-50 px-3 py-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange("");
            editorRef.current?.setData("");
            setInstanceKey((prev) => prev + 1);
          }}
        >
          Clear content
        </button>
      </div>
    </div>
  );
}
