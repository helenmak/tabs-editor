import Vue from 'vue'
import App from './App'
import router from './router'

import VueDraggableResizable from 'vue-draggable-resizable'

Vue.config.productionTip = false

Vue.component('vue-draggable-resizable', VueDraggableResizable)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
