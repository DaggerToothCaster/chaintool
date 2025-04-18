import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import router from "@/plugin/router/index.js"
import '@/assets/css/main.scss'
import store from '@/plugin/store'

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.config.productionTip = false



// 过滤器
import * as filters from './utils/filters.js'
Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key])//插入过滤器名和对应方法
})


// 导入ethers
import { ethers } from 'ethers';
Vue.prototype.$ethers = ethers;
console.log('ethers 库',ethers)

// 文件保存工具
var FileSaver = require('file-saver');
Vue.prototype.$FileSaver = FileSaver;
// console.log('文件保存库',FileSaver)

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app')
