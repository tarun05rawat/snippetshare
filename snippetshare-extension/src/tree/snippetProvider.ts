import * as vscode from 'vscode';

export class SnippetItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly code: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  contextValue = 'snippetItem';
}

export class SnippetProvider implements vscode.TreeDataProvider<SnippetItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | void> = new vscode.EventEmitter<SnippetItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<SnippetItem | undefined | void> = this._onDidChangeTreeData.event;

  private mockData = [
    {
      workspace: 'Global',
      snippets: [
        { title: 'Greet Function.py', code: 'def greet(name): return f"Hello, {name}"' },
        { title: 'Debounce.js', code: 'function debounce(fn, t) { let timer; ... }' },
      ]
    },
    {
      workspace: 'Private',
      snippets: [
        { title: 'Log Wrapper.ts', code: 'export const log = (msg: string) => console.log(msg);' },
      ]
    }
  ];

  getTreeItem(element: SnippetItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SnippetItem): Thenable<SnippetItem[]> {
    if (!element) {
      // Return workspace folders
      return Promise.resolve(this.mockData.map(ws =>
        new SnippetItem(ws.workspace, '', vscode.TreeItemCollapsibleState.Collapsed)
      ));
    } else {
      // Return snippets under a workspace
      const ws = this.mockData.find(w => w.workspace === element.label);
      if (!ws) return Promise.resolve([]);

      return Promise.resolve(ws.snippets.map(snippet =>
        new SnippetItem(
          snippet.title,
          snippet.code,
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'snippetshare.insertSnippet',
            title: 'Insert Snippet',
            arguments: [snippet.code]
          }
        )
      ));
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
