import { App, FuzzySuggestModal, FuzzyMatch, setTooltip } from "obsidian";
import { Toolchain } from "./toolchain";
import path from "path";

export class DownloadModal extends FuzzySuggestModal<string> {
    private items: string[];
    private serverIP: string
    private tmpDirPath: string
    private mainDirFilePath: string
    private vaultName: string
    private API_TOKEN: string

    constructor(app: App, items: string[], serverIP: string, vaultName: string, mainDirFilePath: string, tmpDirPath: string, API_TOKEN: string) {
        super(app);
        this.items = items;
        this.serverIP = serverIP
        this.tmpDirPath = tmpDirPath
        this.vaultName = vaultName
        this.mainDirFilePath = mainDirFilePath
        this.API_TOKEN = API_TOKEN
    }

    getItems(): string[] {
        return this.items;
    }

    getItemText(item: string): string {
        return item;
    }

    async onChooseItem(item: string): Promise<void> {
        const backupPath = await Toolchain.downloadFromServer(this.serverIP, item, this.vaultName, this.tmpDirPath, this.API_TOKEN)
        
        const zipPath = path.join(this.tmpDirPath, "vault-latest-local.zip");
        if (!Toolchain.isDirectoryEmpty(this.mainDirFilePath))
            await Toolchain.createZipArchive(this.mainDirFilePath, zipPath) // create local vault copy
        Toolchain.unzipAchive(backupPath, this.mainDirFilePath)
    }

    renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
        const value = item.item;

        const container = el.createDiv({ cls: "backup-suggestion" });

        container.createEl("div", {
          text: value,
          cls: "backup-name"
        });

        container.createEl("small", {
          text: "Click to download",
          cls: "backup-hint"
        });
    }
}