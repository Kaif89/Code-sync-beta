import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Terminal } from "lucide-react";

interface OutputPanelProps {
  output: string;
  isError: boolean;
  isLoading: boolean;
}

export default function OutputPanel({ output, isError, isLoading }: OutputPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card border-t border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Terminal className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Output</h3>
        {isLoading && (
          <span className="text-xs text-muted-foreground ml-auto">Running...</span>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!output && !isLoading && (
            <p className="text-sm text-muted-foreground italic">
              Click "Run Code" to see output here
            </p>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>Executing code...</span>
            </div>
          )}
          
          {output && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm mb-2">
                {isError ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Success</span>
                  </>
                )}
              </div>
              <pre className={`text-xs font-mono whitespace-pre-wrap break-words p-3 rounded-lg ${
                isError ? "bg-destructive/10 text-destructive" : "bg-secondary/50"
              }`}>
                {output}
              </pre>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
