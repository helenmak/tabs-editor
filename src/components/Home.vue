<template>
  <div class="hello">
    <label>
      Загрузить текст
      <input type="file" @change="loadFile">
    </label>

    <button @click="saveInFile">Save in file </button>

    <div class="text-editor">
      <div
        v-for="(row, rowNumber) in textToEdit"
        class="row"
      >
        <span
          class="row-content"
          contenteditable
          @input="editSongText($event, rowNumber)"
        >
          <span
            v-for="letter in row"
            class="row-letter"
          >{{letter}}</span>
        </span>

        <div
          v-if="isAboveText(rowNumber)"
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
import { intersperse, prepend, append, compose, assocPath, sortBy, prop, mapObjIndexed, clone } from 'ramda'
import VueDraggableResizable from 'vue-draggable-resizable'

export default {
  name: 'Home',
  components: { VueDraggableResizable },
  data () {
    return {
      text: [],
      textToEdit: ["\r\n","Замученный дорогой, я выбился из сил, ","\r\n","И в доме лесника я ночлега попросил. ","\r\n","С улыбкой добродушной старик меня впустил, ","\r\n","И жестом дружелюбным на ужин пригласил. ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу! ","\r\n","","\r\n","На улице темнело, сидел я за столом. ","\r\n","Лесник сидел напротив, болтал о том, о сем. ","\r\n","Что нет среди животных у старика врагов, ","\r\n","Что нравится ему подкармливать волков. ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу! ","\r\n","","\r\n","И волки среди ночи завыли под окном. ","\r\n","Старик заулыбался и вдруг покинул дом. ","\r\n","Но вскоре возвратился с ружьем на перевес: ","\r\n","Друзья хотят покушать, пойдем приятель в лес! ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу!","\r\n",""],
      tabs: {},
      textToSave: ''
    }
  },
  methods:{
    loadFile(event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        this.text = result.split('\r\n')
        this.prepareNewTextToEditor(this.text)
      }
      reader.readAsText(file, 'utf-8')
    },
    prepareNewTextToEditor(text) {
      const createTextWithSeparators = compose(prepend('\r\n'), intersperse('\r\n'))
      this.textToEdit = createTextWithSeparators(text).map(textRow => textRow.trim())
    },
    isAboveText(rowNumber) {
      if (rowNumber === (this.textToEdit.length - 1)) return false
      const nextRowWithoutSymbols = this.textToEdit[ rowNumber+1 ].trim()
      const nextRowLength = nextRowWithoutSymbols.length
      return Boolean(nextRowLength)
    },
    addTab(rowNumber) {
      this.tabs = {
        ...this.tabs,
        [rowNumber]: append({ text: '', position: 0, editable: false }, this.tabs[rowNumber])
      }
    },
    editMode(event, value, rowNumber, tabNumber) {
      this.clearSelection()
      this.tabs = assocPath([rowNumber, tabNumber, 'editable'], value, this.tabs)
      event.target.click()
    },
    clearSelection() {
      window.getSelection().removeAllRanges()
    },
    changeText(event, rowNumber, tabNumber) {
      this.tabs = assocPath([rowNumber, tabNumber, 'text'], event.target.innerText, this.tabs)
    },
    handleDragTab(left, rowNumber, tabNumber) {
      this.tabs = assocPath([rowNumber, tabNumber, 'position'], left/11, this.tabs)
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
      const fileNameToSave = 'fileTabs'
      const link = document.createElement('a')
      link.href = textToSaveAsURL
      link.setAttribute('download', fileNameToSave)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    editSongText(event, row){
      this.textToEdit[row] = event.target.innerText
    }
  }
}
</script>

<style scoped>
  .row {
    text-align: left;
    display: flex;
    justify-content: space-between;
    font-family: Courier;
    border: 1px solid aliceblue;
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
</style>
