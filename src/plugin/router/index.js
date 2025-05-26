import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'index',
        component: () => import('@/views/home/index.vue')
    },
    {
        path: '/1.Private-key-load-address',
        name: '1.Private-key-load-address',
        component: () => import('@/views/1.Private-key-load-address/index.vue')
    },
    {
        path: '/2.Mnemonic-words-create-accounts',
        name: '2.Mnemonic-words-create-accounts',
        component: () => import('@/views/2.Mnemonic-words-create-accounts/index.vue')
    },
    {
        path: '/3.KeyStore-import-and-export',
        name: '3.KeyStore-import-and-export',
        component: () => import('@/views/3.KeyStore-import-and-export/index.vue')
    },
    {
        path: '/4.Wallet-information-and-signed-transactions',
        name: '4.Wallet-information-and-signed-transactions',
        component: () => import('@/views/4.Wallet-information-and-signed-transactions/index.vue')
    },
    {
        path: '/5.function-sign',
        name: '5.function-sign',
        component: () => import('@/views/5.function-sign/index.vue')
    },
    {
        path: '/6.event-topic',
        name: '6.event-topic',
        component: () => import('@/views/6.event-topic/index.vue')
    },
    {
        path: '/7.calldata-encode',
        name: '7.calldata-encode',
        component: () => import('@/views/7.calldata-encode/index.vue')
    },
    {
        path: '/8.eth-unit-converter',
        name: '8.eth-unit-converter',
        component: () => import('@/views/8.eth-unit-converter/index.vue')
    },
    {
        path: '/9.abi',
        name: '9.abi',
        component: () => import('@/views/9.abi/index.vue')
    },
    {
        path: '/10.sign',
        name: '10.sign',
        component: () => import('@/views/10.sign/index.vue')
    },
    {
        path: '/11.EventLog',
        name: '11.EventLog',
        component: () => import('@/views/11.EventLog/index.vue')
    },
    {
        path: '/12.Batch-Address-Balance',
        name: '12.Batch-Address-Balance',
        component: () => import('@/views/12.Batch-Address-Balance/index.vue')
    },
    {
        path: '/13.node-monitor',
        name: '13.node-monitor',
        component: () => import('@/views/13.node-monitor/index.vue')
    },
    {
        path: '/14.add-chain',
        name: '14.add-chain',
        component: () => import('@/views/14.add-chain/index.vue')
    },
    {
        path: '/pool/:poolName',
        name: 'pool-detail',
        component: () => import('@/views/pool/index.vue')
    },
]

const router = new VueRouter({
    // mode: 'history',
    routes
})

export default router
