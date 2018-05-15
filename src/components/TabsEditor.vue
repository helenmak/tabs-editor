<template>
  <div class="wrapper">

    <div class="controls">
      <div class="controls-load">
        <input
          type="file"
          @change="handleLoadFile"
          class="controls-load-input"
          ref="loadInput"
        >
        <div class = 'btn btn-load' @click="loadFile">Load song text</div>
      </div>
      <div class="controls-actions">
        <div class = 'btn btn-save' @click="saveInFile">Save tabs in file</div>
        <div v-if="mode === 'show'" @click="editSongText" class = 'btn btn-edit'>Edit song text</div>
        <div v-else @click="saveEditedText" class = 'btn btn-save-text'>Save text changes</div>
      </div>
    </div>

    <div class="text-editor">
      <div
        v-for="(row, rowNumber) in textToEdit"
        class="row"
      >
        <span
          v-if="mode==='show'"
          class="row-content"
        >
          <span
            v-for="letter in row"
            class="row-letter"
          >{{letter}}</span>
        </span>

        <span
          v-else
          class="row-content"
          contenteditable
          @input="handleEditText($event, rowNumber)"
          @keypress.enter.prevent
        >{{row}}</span>

        <div
          v-if="isUnderText(rowNumber)"
          class="tabs-row"
        >
          <div class="tabs-field">
            <vue-draggable-resizable
              v-for="(tab, tabNumber) in tabs[rowNumber]"
              :key="tabNumber"
              :parent="true"
              :draggable="!tab.editable"
              :grid="[11]"
              :resizable="false"
              @dragging="handleDragTab($event, rowNumber, tabNumber)"
              axis="x"
              :handles="[]"
              :h="60"
              class="tab-wrapper"
              style="width: auto"
            >
              <div
                @input="changeText($event, rowNumber, tabNumber)"
                @dblclick="editMode($event, true, rowNumber, tabNumber)"
                :contenteditable="tab.editable"
                @blur="editMode($event, false, rowNumber, tabNumber)"
                @keyup.enter="editMode($event, false, rowNumber, tabNumber)"
                class="tab-content"
              >
              </div>
            </vue-draggable-resizable>
          </div>
          <div
            @click="addTab(rowNumber)"
            class="add"
          >
            +
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { intersperse, prepend, append, compose, assocPath, sortBy, prop, mapObjIndexed, clone, path, omit } from 'ramda'
import VueDraggableResizable from 'vue-draggable-resizable'

export default {
  name: 'Home',
  components: { VueDraggableResizable },
  data () {
    return {
      mode: 'show',
      textToDisplayEditMode: [],
      textToEdit: [],
      tabs: {},
      tabsToDisplayInEditMode: [],
      textToSave: '',
      fileName: ''
    }
  },
  methods:{
    loadFile(){
      this.$refs.loadInput.click()
    },
    handleLoadFile(event) {
      this.clearState()
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if(result.indexOf('�') > (-1)) {
          reader.readAsText(file, 'windows-1251')
          return
        }
        const text = this.splitText(result)
        this.prepareNewTextToEditor(text)
        this.fileName = file.name
      }
      reader.readAsText(file, 'utf-8')
    },
    splitText(text) {
      let delimiter = '\n'
      if(text.indexOf('\r\n')>(-1)){
        delimiter = '\r\n'
      } else if (text.indexOf('\r')>(-1)){
        delimiter = '\r'
      }
      return text.split(delimiter)
    },
    prepareNewTextToEditor(text) {
      const createTextWithSeparators = compose(prepend('\r\n'), intersperse('\r\n'))
      this.textToEdit = createTextWithSeparators(text).map(textRow => textRow.trim())
    },
    isUnderText(rowNumber) {
      const isLastRow = rowNumber === (this.textToEdit.length - 1)
      if (isLastRow) return false
      const nextRowWithoutSymbols = this.textToEdit[ rowNumber+1 ].trim()
      const nextRowLength = nextRowWithoutSymbols.length
      return Boolean(nextRowLength)
    },
    addTab(rowNumber) {
      this.tabs = assocPath(
        [rowNumber],
        append({ text: '', position: 0, editable: false }, path([rowNumber], this.tabs)),
        this.tabs)
    },
    editMode(event, value, rowNumber, tabNumber) {
      this.clearSelection()
      this.tabs = assocPath([rowNumber, tabNumber, 'editable'], value, this.tabs)
    },
    clearSelection() {
      window.getSelection().removeAllRanges()
    },
    changeText(event, rowNumber, tabNumber) {
      this.tabs = assocPath([rowNumber, tabNumber, 'text'], event.target.innerText, this.tabs)
    },
    handleDragTab(left, rowNumber, tabNumber) {
      this.tabs = assocPath([rowNumber, tabNumber, 'position'], left/11, this.tabs) // 11 is for letter container width
    },
    transformArrayToText() {
      let tabsRows = {}
      const transformTabs = (rowContent, i) => {
        const result = this.transformRowTabsToText(rowContent)
        tabsRows = assocPath([i], result, tabsRows)
      }
      mapObjIndexed(transformTabs, this.tabs)

      let text = clone(this.textToEdit)
      const insertTabToText = (tabRow, rowNumber) => text[rowNumber] = tabRow
      mapObjIndexed(insertTabToText, tabsRows)

      this.textToSave = text.join('\r\n')
    },
    transformRowTabsToText(tabs) {
      const sortedTabs = sortBy(prop('position'), tabs)
      return sortedTabs.reduce((acc, tab) => {
        const accumulatorLength = acc.length
        const lengthOfLastTabInRow = accumulatorLength ? (acc[accumulatorLength-1].length - 1) : 0
        const lastIndentPosition = tab.position
        const indents = accumulatorLength ? lastIndentPosition - accumulatorLength - lengthOfLastTabInRow : lastIndentPosition
        const textIndents = Array(indents).fill(' ')
        const textIndentsWithTab = append(tab.text, textIndents)
        return [...acc, ...textIndentsWithTab]
      }, []).join('')
    },
    saveInFile() {
      this.transformArrayToText()
      const textToSave = this.textToSave
      const textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"})
      const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob)
      let fileNameToSave = this.fileName
      if(this.fileName.indexOf('.txt') > (-1)){
        fileNameToSave = `${this.fileName.slice(0, -4)}_tabs` // -4 is for '.txt'
      }
      const link = document.createElement('a')
      link.href = textToSaveAsURL
      link.setAttribute('download', fileNameToSave)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    editSongText() {
      this.mode = 'edit'
      this.textToDisplayEditMode = this.textToEdit
    },
    handleEditText(event, row){
      if(!event.target.textContent) this.textToDisplayEditMode = omit([row], this.textToEdit)
      this.textToDisplayEditMode = assocPath([row], event.target.textContent, this.textToEdit)
    },
    saveEditedText(){
      this.mode = 'show'
      this.textToEdit = clone(this.textToDisplayEditMode)
      this.textToDisplayEditMode = []
    },
    clearState() {
      this.textToDisplayEditMode = []
      this.textToEdit = []
      this.textToSave = ''
      this.tabs = {}
      this.fileName = ''
    }
  }
}
</script>

<style scoped>
  .wrapper {
    width: 900px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .row {
    text-align: left;
    display: flex;
    justify-content: space-between;
    font-family: Courier;
    border: 1px solid aliceblue;
    line-height: 1.2em;
  }

  .row-content {
    display: flex;
  }

  .row-letter {
    width: 11px;
  }

  .tabs-row {
    display: flex;
    flex: 1 1 auto;
    justify-content: flex-end;
  }

  .add {
    width: 20px;
    cursor: pointer;
    box-sizing: border-box;
    text-align: center;
  }

  .add:hover {
    box-sizing: border-box;
    background: lightblue;
  }

  .tabs-row .tabs-field {
    display: flex;
    flex: 1 1 auto;
    position: relative;
  }

  .tabs-row .tabs-field .tab-content {
    border: 1px solid cornflowerblue;
    width: 100%;
  }

  .tabs-row .tabs-field .tab-wrapper {
    display: flex;
    max-width: 100%;
    min-width: 20px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    width: 80%;
    margin: 0 auto 20px auto;
  }

  .controls-load {
    margin: 5px auto;
    width: 100%;
  }

  .controls-load-input {
    position: absolute;
    left: -9999px;
  }

  .controls-actions {
    display: flex;
    justify-content: space-between;
  }

  .btn {
    display: flex;
    height: 50px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  .btn.btn-load {
    background-color: lightblue;
    width: 100%;
  }

  .btn.btn-edit {
    background-color: cadetblue;
    width: 300px;
  }

  .btn.btn-save {
    background-color: steelblue;
    width: 300px;
  }

  .btn.btn-save-text {
    background-color: lightskyblue;
    width: 300px;
  }
</style>
