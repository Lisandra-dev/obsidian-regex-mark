import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import RegexMark from "./main";
import { hasToHide, isValidRegex } from "./utils";


export interface SettingOption {
  regex: string
  class: string
  hide?: boolean
}

export type SettingOptions = SettingOption[]

export class RemarkRegexSettingTab extends PluginSettingTab {
	plugin: RegexMark;

	constructor(app: App, plugin: RegexMark) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const productTitle = containerEl.createDiv();
		productTitle.createEl("p", {
			text: "Regex Mark",
			cls: "h2",
		});
		productTitle.createEl("p", {
			text: "Regex Mark is a plugin that allows you to add custom CSS class to text that matches a regex.",
		});
		const link = productTitle.createEl("p", {
			text: "If you are not familiar with regex, you can use this tool to help you build regex: ",
			cls: "secondary",
		});
		link.createEl("a", {
			text: "https://regex101.com/",
			attr: {
				href: "https://regex101.com/",
				target: "_blank",
			},
		});

		const infoSub = productTitle.createEl("p");
		infoSub.innerHTML = "You can create custom markdown markup with using the <code>{{open:regex}}</code> and <code>{{close:regex}}</code>. The open and close regex will be hidden in Live-Preview. You need to use the \"hide\" toggle to make it work.<br><br>Note that \"overwriting\" markdown (ie underline with underscore as <code>__underline__</code>) will not work in Reading Mode.";
		//I know it's a BAD methods to use but the other methods is very bad to write, and I DON'T WANT TO WRITE IT.

		for (const data of this.plugin.settings) {
			new Setting(containerEl)
				.setClass("regex-setting")
				.addText((text) => {
					text
						.setValue(data.regex)
						.onChange(async (value) => {
							data.regex = value;
							await this.plugin.saveSettings();
							text.inputEl.setAttribute("regex-value", data.regex);
							//disable hide toggle if no group is found
							this.disableToggle(data);
						});
					text.inputEl.addClass("extra-width");
					this.addTooltip("regex", text.inputEl);
					text.inputEl.setAttribute("regex-value", data.regex);
				})
				.addText((text) => {
					text
						.setValue(data.class)
						.onChange(async (value) => {
							data.class = value;
							await this.plugin.saveSettings();
							text.inputEl.setAttribute("css-value", data.class);
						});
					text.inputEl.addClass("extra-width");
					this.addTooltip("class", text.inputEl);
					text.inputEl.setAttribute("css-value", data.class);
				})
				.addToggle((toggle) => {
					toggle
						.setValue(data.hide ?? false)
						.setTooltip("Hide the regex in Live-Preview, only keeping the content.")
						.onChange(async (value) => {
							data.hide = value;
							await this.plugin.saveSettings();
						});
					toggle.toggleEl.addClass("group-toggle");
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Delete this regex")
						.onClick(async () => {
							this.plugin.settings = this.plugin.settings.filter((d) => d !== data);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("arrow-up")
						.setTooltip("Move this regex up")
						.onClick(async () => {
							const index = this.plugin.settings.indexOf(data);
							if (index > 0) {
								this.plugin.settings.splice(index - 1, 0, this.plugin.settings.splice(index, 1)[0]);
								await this.plugin.saveSettings();
								this.display();
							}
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("arrow-down")
						.setTooltip("Move this regex down")
						.onClick(async () => {
							const index = this.plugin.settings.indexOf(data);
							if (index < this.plugin.settings.length - 1) {
								this.plugin.settings.splice(index + 1, 0, this.plugin.settings.splice(index, 1)[0]);
								await this.plugin.saveSettings();
								this.display();
							}
						});
				});
			this.disableToggle(data);

		}

		//add + button
		new Setting(containerEl)
			.addButton((button) => {
				button
					.setButtonText("Add Regex")
					.setTooltip("Add a new regex")
					.onClick(async () => {
						this.plugin.settings.push({
							regex: "",
							class: "",
							hide: false,
						});
						await this.plugin.saveSettings();
						this.display();
					});
			})
			.addButton((button) => {
				button
					.setButtonText("Verify & apply")
					.setTooltip("Verify and apply the regexes")
					.onClick(async () => {
						const regexes = this.plugin.settings.map((d) => d.regex);
						const valid = regexes.every((d) => this.verifyRegex(d));
						const css = this.plugin.settings.map((d) => d.class);
						const validCss = css.every((d) => this.verifyClass(d));
						if (valid && validCss) {
							this.plugin.updateCmExtension();
							new Notice("Regexes are valid and applied.");
						} else {
							let msg = "Invalid";
							if (!valid) msg += " regexes";
							if (!valid && !validCss) msg += " and";
							if (!validCss) msg += " css";
							msg += ".";
							new Notice(msg);
						}

					});

			});

	}

	addTooltip(text: string, cb: HTMLElement) {
		cb.onfocus = () => {
			const tooltip = cb.parentElement?.createEl("div", { text, cls: "tooltip" });
			if (tooltip) {
				const rec = cb.getBoundingClientRect();
				tooltip.style.top = `${rec.top + rec.height + 5}px`;
				tooltip.style.left = `${rec.left + rec.width / 2}px`;
			}
		};
		cb.onblur = () => {
			cb.parentElement?.querySelector(".tooltip")?.remove();
		};
	}

	verifyRegex(regex: string) {
		const cb = document.querySelector(`input[regex-value="${escapeRegExp(regex)}"]`);
		if (regex.trim().length === 0) {
			if (cb) cb.addClass("is-invalid");
			return false;
		}
		try {
			new RegExp(regex);
			if (cb) cb.removeClass("is-invalid");
			return true;
		} catch (e) {
			console.warn("Invalid regex", regex);
			if (cb) cb.addClass("is-invalid");
			return false;
		}
	}

	verifyClass(css: string) {
		const cb = document.querySelector(`input[css-value="${escapeRegExp(css)}"]`);
		if (css.trim().length === 0) {
			if (cb) cb.addClass("is-invalid");
			return false;
		}
		cb?.removeClass("is-invalid");
		return true;
	}

	disableToggle(data: SettingOption) {
		const index = this.plugin.settings.indexOf(data);
		const toggle = document.querySelectorAll(".group-toggle")[index];
		const verify = !hasToHide(data.regex) || !isValidRegex(data.regex) || data.regex.trim().length === 0;
		if (toggle) {
			toggle.toggleClass("is-disabled-manually", verify);
		}
	}
}

function escapeRegExp(regex: string) {
	return regex.replace(/[\\]/g, "\\$&"); // $& means the whole matched string
}


