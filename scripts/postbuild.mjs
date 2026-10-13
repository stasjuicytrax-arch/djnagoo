// GitHub Pages не знает SPA-маршрутов: /print и 404 отдают тот же index.html
import { copyFileSync, mkdirSync } from 'node:fs'
mkdirSync('dist/print', { recursive: true })
copyFileSync('dist/index.html', 'dist/print/index.html')
copyFileSync('dist/index.html', 'dist/404.html')
