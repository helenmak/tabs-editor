<template>
  <div class="hello">
    <input type="file" @change="loadFile">
    <h1>Text</h1>
    <div class="text-editor">
      <div
        v-for="(row, rowNumber) in textToEdit"
        class="row"
      >
        <span>{{rowNumber}}: {{row}}</span>
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
              :resizable="false"
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
import { intersperse, prepend, append, compose, assocPath } from 'ramda'
import VueDraggableResizable from 'vue-draggable-resizable'

export default {
  name: 'Home',
  components: { VueDraggableResizable },
  data () {
    return {
      text: [],
      textToEdit: ["\r\n","Замученный дорогой, я выбился из сил, ","\r\n","И в доме лесника я ночлега попросил. ","\r\n","С улыбкой добродушной старик меня впустил, ","\r\n","И жестом дружелюбным на ужин пригласил. ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу! ","\r\n","","\r\n","На улице темнело, сидел я за столом. ","\r\n","Лесник сидел напротив, болтал о том, о сем. ","\r\n","Что нет среди животных у старика врагов, ","\r\n","Что нравится ему подкармливать волков. ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу! ","\r\n","","\r\n","И волки среди ночи завыли под окном. ","\r\n","Старик заулыбался и вдруг покинул дом. ","\r\n","Но вскоре возвратился с ружьем на перевес: ","\r\n","Друзья хотят покушать, пойдем приятель в лес! ","\r\n","","\r\n","Будь как дома путник, я ни в чем не откажу, ","\r\n","Я ни в чем не откажу, я ни в чем не откажу! ","\r\n","Множество историй, коль желаешь расскажу, ","\r\n","Коль желаешь расскажу, коль желаешь расскажу!","\r\n",""],
      tabs: {}
    }
  },
  methods:{
    loadFile(event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        this.text = result.split('\r\n')
        this.prepareTextToEditor(this.text)
      }
      reader.readAsText(file, 'windows-1251')
    },
    prepareTextToEditor(text) {
      const createTextWithSeparators = compose(prepend('\r\n'), intersperse('\r\n'))
      this.textToEdit = createTextWithSeparators(text)
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
      // this.tabs = prepend({ text: '', position: 0 }, this.tabs[rowNumber])
    },
    editMode(event, value, rowNumber, tabNumber) {
      console.log(event)
      this.clearSelection()
      this.tabs = assocPath([rowNumber, tabNumber, 'editable'], value, this.tabs)
      event.target.click()
    },
    clearSelection() {
      window.getSelection().removeAllRanges()
    },
    changeText(event, rowNumber, tabNumber) {
      console.log(event.target.innerText)
      this.tabs = assocPath([rowNumber, tabNumber, 'text'], event.target.innerText, this.tabs)
      // this.tabs = {
      //   ...this.tabs,
      //   [rowNumber]: prepend({text: '', position: 0 }, this.tabs[rowNumber])
      // }
    }
  }
}
</script>

<style scoped>
  .row {
    text-align: left;
    display: flex;
    justify-content: space-between;
    border: 1px solid red;
  }

  .tabs-row {
    display: flex;
    flex: 1 1 auto;
    justify-content: flex-end;
  }

  .tabs-row .add {
    border: 1px solid yellow;
  }

  .tabs-row .tabs-field {
    display: flex;
    border: 1px solid black;
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
    min-width: 15px;
  }
</style>
