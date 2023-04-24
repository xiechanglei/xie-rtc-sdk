import ts from "rollup-plugin-ts"
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser'
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default {
    input: "./src/index.ts",
    plugins: [
        nodePolyfills(),//打包node内置模块，浏览器端使用，如events
        resolve({ browser: true }),//加载第三方模块
        commonjs(),//common转esm
        ts({ tsconfig: "tsconfig.json" }),//typescript support
        terser() //minify the code and remove comments
    ],
    output: [
        {
            format: "umd",//umd format
            file: "dist/index.js", //output
            name: "UscRtc", //name of umd
            exports: "named",//remove export default warning
            sourcemap: true
        },
        {
            format: "esm",//esm format
            file: "dist/index.esm.js",//output file
            sourcemap: true
        }
    ],
}