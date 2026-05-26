import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianSynchronizerPlugin from "./main";

export interface ObsidianSynchronizerPluginSettings {
	serverIP: string;
	API_TOKEN: string
}

export const DEFAULT_SETTINGS: ObsidianSynchronizerPluginSettings = {
	serverIP: '127.0.0.1:25380',
	API_TOKEN: ''
}

export class SettingTab extends PluginSettingTab {
	plugin: ObsidianSynchronizerPlugin;

	constructor(app: App, plugin: ObsidianSynchronizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Sync server address and port')
			.setDesc('Example 127.0.0.1:25380')
			.addText(text => text
				.setPlaceholder('127.0.0.1:25380')
				.setValue(this.plugin.settings.serverIP)
				.onChange(async (value) => {
					this.plugin.settings.serverIP = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('API TOKEN')
			.setDesc('token for access to API')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.API_TOKEN)
				.onChange(async (value) => {
					this.plugin.settings.API_TOKEN = value;
					await this.plugin.saveSettings();
				}));
	}
}