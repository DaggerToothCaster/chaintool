import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import wallet from './modules/wallet'
Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    wallet,
  },
  getters
})

export default store
