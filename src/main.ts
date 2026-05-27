import {Notice, Plugin, FileSystemAdapter} from 'obsidian';
import {DEFAULT_SETTINGS, ObsidianSynchronizerPluginSettings, SettingTab} from "./settings";
import { Toolchain } from './toolchain';
import path from "path";
import fs from "fs"
import os from "os"
import { DownloadModal } from "./download_modal";

export default class ObsidianSynchronizerPlugin extends Plugin {
	settings!: ObsidianSynchronizerPluginSettings;
	
	async upload(){
		new Notice('Upload to server!' + ' Server IP: ' + this.settings.serverIP);
		const adapter = this.app.vault.adapter;
		
		if (adapter instanceof FileSystemAdapter) {
			const vaultPath = adapter.getBasePath();
			const vaultPathArray = vaultPath.split('/')
			const vaultName = vaultPathArray[vaultPathArray.length - 1]
			const tmpDir = path.join(os.tmpdir(), "obsidian-synchronizer");
			const zipPath = path.join(tmpDir, "vault-latest.zip");
			if (!fs.existsSync(tmpDir)) 
    			fs.mkdirSync(tmpDir, { recursive: true });
			
			await Toolchain.createZipArchive(vaultPath, zipPath)
			const uploadResult = await Toolchain.uploadToServer(this.settings.serverIP, zipPath, vaultName as any, this.settings.API_TOKEN)

			if(uploadResult == 200) {
				fs.rmdirSync(tmpDir, {recursive: true})
				new Notice('Archive have been successfully uploaded to server. ' + this.settings.serverIP);
			}
		}
	}

	async download(){
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			const vaultPath = adapter.getBasePath();
			const vaultPathArray = vaultPath.split('/')
			const vaultName = vaultPathArray[vaultPathArray.length - 1] || "test_vault"
			const tmpDir = path.join(os.tmpdir(), "obsidian-synchronizer-from-server");
			const backupNames = await Toolchain.getAvailableBackupsFromServer(this.settings.serverIP, vaultName, this.settings.API_TOKEN)
			
			if (!fs.existsSync(tmpDir)) 
				fs.mkdirSync(tmpDir, { recursive: true });

		    new DownloadModal(this.app, backupNames, this.settings.serverIP, vaultName, vaultPath, tmpDir, this.settings.API_TOKEN).open();
			new Notice('Archive have been successfully downloaded and unzip');
		}
	}

	async onload() {
		await this.loadSettings();
		
		// This creates an icon in the left ribbon.
		this.addRibbonIcon('up-arrow-with-tail', 'Upload', async (evt: MouseEvent) => {
			await this.upload()
		});

		this.addRibbonIcon('down-arrow-with-tail', 'Download', async (evt: MouseEvent) => {			
			await this.download()
		});

		this.addCommand({
    		id: "upload",
    		name: "Upload",
    		icon: "refresh-cw",
    		callback: async () => {
    		    await this.upload()
    		}
		});

		this.addCommand({
    		id: "download",
    		name: "Download",
    		icon: "refresh-cw",
    		callback: async () => {
    		    await this.download()
    		}
		});

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps. #TODO: додати статус репозиторія коли було завантажено, коли відвантажено
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status bar text');

		this.addSettingTab(new SettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled. #TODO: розбіратися що це і навіщо
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ObsidianSynchronizerPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
