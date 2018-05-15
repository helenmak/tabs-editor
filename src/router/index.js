import Vue from 'vue'
import Router from 'vue-router'
import TabsEditor from '@/components/TabsEditor'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'TabsEditor',
      component: TabsEditor
    }
  ]
})
