const fs = require('fs')

const toCopy = ['background.js', 'inject.js', 'runtime.js']

const files = fs.readdirSync('./www').filter(file => file.endsWith('.js'))
files.forEach(file => {
  const shouldCopy = toCopy.find(toCopyFile => file.startsWith(`${toCopyFile.split('.')[0]}`))
  if (shouldCopy) {
    console.log('copying', `./www/${file}`, `./www/${shouldCopy}`)
    fs.copyFileSync(`./www/${file}`, `./www/${shouldCopy}`)
  }
})

const needle = `<link rel="icon" type="image/png" href="assets/icon/favicon.png"/>`
const css = `
<style>
	html {
		min-width: 500px;
		min-height: 888px;
	}
	::-webkit-scrollbar {
		width: 0px;
		background: transparent;
	}
</style>
`

// Inject chrome extension specific CSS to make window bigger
const index = fs.readFileSync('./www/index.html', { encoding: 'utf-8' })
if (index.indexOf('::-webkit-scrollbar') < 0) {
  const indexWithCss = index.replace(needle, `${needle}\n${css}`)

  if (index === indexWithCss) {
    throw new Error('Could not inject extension css!')
  }

  fs.writeFileSync('./www/index.html', indexWithCss)
}
