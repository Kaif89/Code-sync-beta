// Wire Monaco workers for Vite so IntelliSense and features load correctly
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

declare global {
  // eslint-disable-next-line no-var
  var MonacoEnvironment: {
    getWorker: (moduleId: string, label: string) => Worker;
  } | undefined;
}

// Ensure workers are resolvable at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

export {};



