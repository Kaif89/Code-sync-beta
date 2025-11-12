import * as monaco from "monaco-editor";

interface LSPMessage {
  jsonrpc: string;
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

class LanguageServerClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  >();
  private initialized = false;
  private capabilities: unknown = null;

  constructor(private language: string, private wsUrl: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log(`Connected to ${this.language} language server`);
        this.initialize().then(resolve).catch(reject);
      };

      this.ws.onmessage = (event) => {
        const message: LSPMessage = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error(`WebSocket error for ${this.language}:`, error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log(`Disconnected from ${this.language} language server`);
        this.initialized = false;
      };
    });
  }

  private async initialize(): Promise<void> {
    const response = await this.sendRequest("initialize", {
      processId: null,
      rootUri: null,
      capabilities: {
        textDocument: {
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ["markdown", "plaintext"],
              deprecatedSupport: true,
              preselectSupport: true,
            },
            contextSupport: true,
          },
          hover: {
            dynamicRegistration: false,
            contentFormat: ["markdown", "plaintext"],
          },
        },
      },
    });

    this.capabilities = (response as { capabilities: unknown }).capabilities;
    console.log(`${this.language} server capabilities:`, this.capabilities);

    await this.sendNotification("initialized");
    this.initialized = true;
  }

  private sendRequest(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const message: LSPMessage = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        reject(new Error("WebSocket not connected"));
      }
    });
  }

  private sendNotification(method: string, params?: unknown): void {
    const message: LSPMessage = {
      jsonrpc: "2.0",
      method,
      params,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: LSPMessage): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(message.error);
      } else {
        resolve(message.result);
      }
    }
  }

  async getCompletions(
    uri: string,
    position: monaco.IPosition,
    context: monaco.languages.CompletionContext,
    documentText: string
  ): Promise<monaco.languages.CompletionList> {
    if (!this.initialized) {
      throw new Error("Language server not initialized");
    }

    // Send didOpen notification first
    await this.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: this.language,
        version: 1,
        text: documentText,
      },
    });

    const response = await this.sendRequest("textDocument/completion", {
      textDocument: { uri },
      position,
      context: {
        triggerKind:
          context.triggerKind === monaco.languages.CompletionTriggerKind.Invoke
            ? 1
            : context.triggerKind ===
              monaco.languages.CompletionTriggerKind.TriggerCharacter
            ? 2
            : 3,
        triggerCharacter: context.triggerCharacter,
      },
    });

    if (!response || !(response as { items?: unknown[] }).items) {
      return { suggestions: [] };
    }

    const suggestions: monaco.languages.CompletionItem[] = (
      response as { items: unknown[] }
    ).items.map((item: unknown) => {
      const completionItem = item as {
        label: string;
        kind?: number;
        insertText?: string;
        detail?: string;
        documentation?: string | { value: string };
        sortText?: string;
        filterText?: string;
        textEdit?: {
          range: {
            start: { line: number; character: number };
            end: { line: number; character: number };
          };
        };
        command?: { command: string; arguments?: unknown[] };
      };

      return {
        label: completionItem.label,
        kind: this.mapCompletionItemKind(completionItem.kind),
        insertText: completionItem.insertText || completionItem.label,
        detail: completionItem.detail,
        documentation: completionItem.documentation
          ? {
              value:
                typeof completionItem.documentation === "string"
                  ? completionItem.documentation
                  : completionItem.documentation.value,
              isTrusted: true,
            }
          : undefined,
        sortText: completionItem.sortText,
        filterText: completionItem.filterText,
        range: completionItem.textEdit
          ? {
              startLineNumber: completionItem.textEdit.range.start.line + 1,
              startColumn: completionItem.textEdit.range.start.character + 1,
              endLineNumber: completionItem.textEdit.range.end.line + 1,
              endColumn: completionItem.textEdit.range.end.character + 1,
            }
          : undefined,
        command: completionItem.command
          ? {
              id: completionItem.command.command,
              title: completionItem.command.command,
              arguments: completionItem.command.arguments,
            }
          : undefined,
      };
    });

    return { suggestions };
  }

  private mapCompletionItemKind(
    kind?: number
  ): monaco.languages.CompletionItemKind {
    switch (kind) {
      case 1:
        return monaco.languages.CompletionItemKind.Text;
      case 2:
        return monaco.languages.CompletionItemKind.Method;
      case 3:
        return monaco.languages.CompletionItemKind.Function;
      case 4:
        return monaco.languages.CompletionItemKind.Constructor;
      case 5:
        return monaco.languages.CompletionItemKind.Field;
      case 6:
        return monaco.languages.CompletionItemKind.Variable;
      case 7:
        return monaco.languages.CompletionItemKind.Class;
      case 8:
        return monaco.languages.CompletionItemKind.Interface;
      case 9:
        return monaco.languages.CompletionItemKind.Module;
      case 10:
        return monaco.languages.CompletionItemKind.Property;
      case 11:
        return monaco.languages.CompletionItemKind.Unit;
      case 12:
        return monaco.languages.CompletionItemKind.Value;
      case 13:
        return monaco.languages.CompletionItemKind.Enum;
      case 14:
        return monaco.languages.CompletionItemKind.Keyword;
      case 15:
        return monaco.languages.CompletionItemKind.Snippet;
      case 16:
        return monaco.languages.CompletionItemKind.Color;
      case 17:
        return monaco.languages.CompletionItemKind.File;
      case 18:
        return monaco.languages.CompletionItemKind.Reference;
      case 19:
        return monaco.languages.CompletionItemKind.Folder;
      case 20:
        return monaco.languages.CompletionItemKind.EnumMember;
      case 21:
        return monaco.languages.CompletionItemKind.Constant;
      case 22:
        return monaco.languages.CompletionItemKind.Struct;
      case 23:
        return monaco.languages.CompletionItemKind.Event;
      case 24:
        return monaco.languages.CompletionItemKind.Operator;
      case 25:
        return monaco.languages.CompletionItemKind.TypeParameter;
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.initialized = false;
  }
}

// Language server configurations
const LANGUAGE_SERVERS = {
  python: { wsUrl: "ws://localhost:3000/pylsp" },
  cpp: { wsUrl: "ws://localhost:3000/clangd" },
  c: { wsUrl: "ws://localhost:3000/clangd" },
  go: { wsUrl: "ws://localhost:3000/gopls" },
  java: { wsUrl: "ws://localhost:3000/jdtls" },
  rust: { wsUrl: "ws://localhost:3000/rust-analyzer" },
};

class LanguageServerManager {
  private clients = new Map<string, LanguageServerClient>();
  private registeredProviders = new Set<string>();

  async initializeLanguageServer(language: string): Promise<void> {
    if (!LANGUAGE_SERVERS[language as keyof typeof LANGUAGE_SERVERS]) {
      console.warn(`No language server configured for ${language}`);
      // Ensure at least a fallback provider exists
      this.registerFallbackCompletionProvider(language);
      return;
    }

    if (this.clients.has(language)) {
      return; // Already initialized
    }

    try {
      const config =
        LANGUAGE_SERVERS[language as keyof typeof LANGUAGE_SERVERS];
      const client = new LanguageServerClient(language, config.wsUrl);
      await client.connect();
      this.clients.set(language, client);

      // Register completion provider with Monaco
      this.registerCompletionProvider(language, client);
      console.log(`Language server initialized for ${language}`);
    } catch (error) {
      console.error(
        `Failed to initialize language server for ${language}:`,
        error
      );
      // Register a fallback provider so users still get basic suggestions
      this.registerFallbackCompletionProvider(language);
    }
  }

  private registerCompletionProvider(
    language: string,
    client: LanguageServerClient
  ): void {
    if (this.registeredProviders.has(language)) {
      return;
    }

    const provider: monaco.languages.CompletionItemProvider = {
      provideCompletionItems: async (model, position, context, token) => {
        try {
          const uri = model.uri.toString();
          const text = model.getValue();
          return await client.getCompletions(uri, position, context, text);
        } catch (error) {
          console.error(`Completion error for ${language}:`, error);
          return { suggestions: [] };
        }
      },
    };

    // Register for the specific language
    monaco.languages.registerCompletionItemProvider(language, provider);

    // Also register for alternative language IDs if needed
    if (language === "cpp") {
      monaco.languages.registerCompletionItemProvider("c", provider);
    } else if (language === "c") {
      monaco.languages.registerCompletionItemProvider("cpp", provider);
    }

    this.registeredProviders.add(language);
  }

  // Basic, in-memory word-based completion as a fallback when LSP isn't available
  private registerFallbackCompletionProvider(language: string): void {
    if (this.registeredProviders.has(`${language}-fallback`)) {
      return;
    }

    const provider: monaco.languages.CompletionItemProvider = {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        const words = new Set<string>();
        const identifierRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
        let match: RegExpExecArray | null;
        // Collect words from the entire document for better suggestions
        const fullText = model.getValue();
        while ((match = identifierRegex.exec(fullText)) !== null) {
          const w = match[0];
          if (w.length >= 2) words.add(w);
        }

        const suggestions: monaco.languages.CompletionItem[] = Array.from(words)
          .filter((w) => (word.word ? w.startsWith(word.word) : true))
          .slice(0, 200)
          .map((w) => ({
            label: w,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: w,
            range,
          }));

        return { suggestions };
      },
    };

    monaco.languages.registerCompletionItemProvider(language, provider);
    if (language === "cpp" || language === "c") {
      monaco.languages.registerCompletionItemProvider("c", provider);
      monaco.languages.registerCompletionItemProvider("cpp", provider);
    }

    this.registeredProviders.add(`${language}-fallback`);
  }

  getClient(language: string): LanguageServerClient | undefined {
    return this.clients.get(language);
  }

  disconnectAll(): void {
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
    this.registeredProviders.clear();
  }
}

export const languageServerManager = new LanguageServerManager();
