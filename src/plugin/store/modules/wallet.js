const state = {
    /**
     * 钱包的链接状态，仅用于页面的判断，实际情况下，页面与钱包链接之后，web3环境是一直存在的，因此不存在主动与钱包切断联系
     */
    isConnect: false,//链接状态
    userAddress: null,//钱包地址
    isInit: false,//合约实例化状态

}

const mutations = {
    set_isConnect(state, value) {
        state.isConnect = value
    },
    set_userAdddress(state, value) {
        state.userAddress = value
    },
    set_isInit(state, value) {
        state.isInit = value
    },


}

const actions = {
    // 设置 链接状态
    setIsConnect({ commit }, value) {
        commit('set_isConnect', value)
    },
    // 设置 钱包地址
    setUserAddress({ commit }, value) {
        commit('set_userAdddress', value)
    },
    // 设置 合约实例化状态
    setIsInit({ commit }, value) {
        commit('set_isInit', value)
    },

}
export default {
    state,
    mutations,
    actions
}