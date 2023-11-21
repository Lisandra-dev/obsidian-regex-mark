import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import RegexMark from './main'

export interface SettingOption {
  regex: string
  class: string
}

export type SettingOptions = SettingOption[]

export class SampleSettingTab extends PluginSettingTab {
  plugin: RegexMark

  constructor(app: App, plugin: RegexMark) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    const productTitle = containerEl.createDiv()
    productTitle.createEl('p', {
      text: 'Regex Mark',
      cls: 'h2',
    })
    productTitle.createEl('p', {
      text: 'Regex Mark is a plugin that allows you to add custom CSS class to text that matches a regex.',
    })
    const link = productTitle.createEl('p', {
      text: 'If you are not familiar with regex, you can use this tool to help you build regex: ',
      cls: 'secondary',
    })
    link.createEl('a', {
      text: 'https://regex101.com/',
      attr: {
        href: 'https://regex101.com/',
        target: '_blank',
      },
    })
    productTitle.createEl('p', {
      text: 'This plugin requires reopen the file to take effect.',
      cls: 'secondary',
    })

    const titleEl = containerEl.createDiv({ cls: 'line' })
    titleEl.createSpan({
      text: 'Regex',
      cls: 'regex title',
    })
    titleEl.createSpan({
      text: 'Class',
      cls: 'class title',
    })
    titleEl.createSpan({
      text: 'Hide',
      cls: 'hidden title',
    })

    const tempData = {
      regex: '',
      class: '',
    }

    const line = (containerEl: HTMLElement, index: number) => {
      let data: SettingOption
      if (index > this.plugin.settings.length - 1 || index < -1)
        return
      else if (index === -1)
        data = { regex: '', class: '' }
      else
        data = this.plugin.settings[index]
      const el = new Setting(containerEl)
        .addText(text => {
          text
            .setPlaceholder('regex')
            .setValue(data.regex)
            .onChange(async (value) => {
              if (index === -1) {
                tempData.regex = value 
              }
              else {
                if (value === '')
                  new Notice('Regex cannot be empty')
                data.regex = value
                this.plugin.settings.splice(index, 1, data)
                await this.plugin.saveSettings()
              }
            })
          text.inputEl.classList.add('regex')
          return text
        })
        .addText(text => {
          text
            .setPlaceholder('class')
            .setValue(data.class)
            .onChange(async (value) => {
              if (index === -1) {
                tempData.class = value 
              }
              else {
                if (value === '')
                  new Notice('Class cannot be empty')
                data.class = value
                this.plugin.settings.splice(index, 1, data)
                await this.plugin.saveSettings()
              }
            })
          text.inputEl.classList.add('class')
          return text
        })
      el.settingEl.classList.remove('setting-item')
      el.infoEl.remove()
      el.controlEl.classList.remove('setting-item-control')
      el.controlEl.classList.add('line')
      return el
    }

    const addValueEl = containerEl.createDiv()
    line(addValueEl, -1)?.setClass('add-value')
      .addButton(button => button
        .setIcon('plus')
        .onClick(async () => {
          if (tempData.regex && tempData.class) {
            this.plugin.settings.push({
              regex: tempData.regex,
              class: tempData.class,
            })
            await this.plugin.saveSettings()
            line(containerEl, this.plugin.settings.length - 1)?.addButton(button => button
              .setIcon('trash')
              .setWarning()
              .onClick(async () => {
                this.plugin.settings.splice(this.plugin.settings.length - 1, 1)
                await this.plugin.saveSettings()
                this.display()
              }))
            tempData.regex = ''
            tempData.class = ''
            const regexInput = addValueEl.querySelector('.regex') as HTMLInputElement
            const classInput = addValueEl.querySelector('.class') as HTMLInputElement
            regexInput.value = ''
            classInput.value = ''
          }
          else {
            new Notice('Regex and Class cannot be empty')
          }
        })
      )

    const dataEl = containerEl.createDiv()
    for (let i = 0; i < this.plugin.settings.length; i++) {
      line(dataEl, i)?.addButton(button => button
        .setIcon('trash')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings.splice(i, 1)
          await this.plugin.saveSettings()
          this.display()
        })
      )
    }
  }

  async hide() {
    this.plugin.settings = this.plugin.settings.filter((value) => value.regex !== '' && value.class !== '')
    await this.plugin.saveSettings()
    this.plugin.updateCmExtension()
    super.hide()
  }
}
