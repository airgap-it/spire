const fs = require('fs')

fs.copyFileSync('extension/manifest.json', 'www/manifest.json')

const needle = `<link rel="icon" type="image/png" href="assets/icon/favicon.png" />`
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

