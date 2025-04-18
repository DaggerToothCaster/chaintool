const autoprefixer = require('autoprefixer')
module.exports = {
  lintOnSave: false,  // 禁止使用eslint
  publicPath: process.env.NODE_ENV !== "development" ? "./" : "/",
  outputDir: './dist/', // build path 打包输出路径
  productionSourceMap: false, // don·t use map 不要把源暴露出去
  devServer: {
    port: 1314, // port
    open: false, // default browser 主动打开默认浏览器
    overlay: { // 报错展示
      warnings: true, // eslint show warnings
      errors: true // eslint show errors
    },
    proxy: {
      //配置跨域
      '/api': {
        target: "http://otc.dbank123.com",
        changOrigin: true,
        pathRewrite: {
          '^/api': '/'
        }
      },
    }
  },
  // chainWebpack: config => {
  //   config.module
  //     .rule('images')
  //     .use('url-loader')
  //     .loader('url-loader')
  //     .tap(options => Object.assign(options, { limit: 20000 }))
  // }
}