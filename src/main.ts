import { Plugin } from 'obsidian'
import { MarkdownProcesser } from './markdownProcesser'
import { cmExtension } from './cmPlugin'
import { SampleSettingTab, SettingOptions } from './setting'
import { Extension } from '@codemirror/state'

export default class RegexMark extends Plugin {
  settings: SettingOptions = []
  extensions: Extension[]
  cmExtension: Extension

  async onload() {
    await this.loadSettings()
    this.addSettingTab(new SampleSettingTab(this.app, this))
    this.registerMarkdownPostProcessor((element: HTMLElement) => {
      MarkdownProcesser(this.settings, element)
    })
    this.cmExtension = cmExtension(this)
    this.extensions = []
    this.updateCmExtension()
    this.registerEditorExtension(this.extensions)
  }

  onunload() {

  }

  async loadSettings() {
    this.settings = Object.assign([], [], await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  updateCmExtension() {
    this.extensions.remove(this.cmExtension)
    this.cmExtension = cmExtension(this)
    this.extensions.push(this.cmExtension)
    this.app.workspace.updateOptions()
  }
}