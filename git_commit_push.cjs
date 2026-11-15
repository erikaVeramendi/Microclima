const { execSync } = require('child_process')

try {
  console.log('--- Staging ---')
  execSync('git add -A', { stdio: 'inherit' })
  console.log('--- Committing ---')
  execSync('git commit -m "feat: transformar EnvironmentalRelationsScreen en Lluvias e inundaciones"', { stdio: 'inherit' })
  console.log('--- Pushing ---')
  execSync('git push origin alba-lluvias', { stdio: 'inherit' })
  console.log('--- Done ---')
} catch (e) {
  console.error(e)
}
