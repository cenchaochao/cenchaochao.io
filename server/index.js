const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const fileMatchers = require('./file-matchers.js')
const { runTasks } = require('./utils/index.js')

const PORT = 5058

const app = express()

app.use(bodyParser.json())
// 静态资源直接nginx做代理，不经过Node
// app.use(express.static(path.join(__dirname, '../build/')))
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../build/index.html'))
// })

app.get('/api/hello', (req, res) => res.send('hello, world'))
app.post('/api/deploy', (req, res) => {

  const reqTime = new Date()

  const commits = req.body.head_commit
  const paths = [...commits.added, ...commits.removed, ...commits.modified]

  const matchers = fileMatchers.filter(matcher => {
    return matcher.name === 'default'
    || paths.some(path => matcher.regExp.test(path))
  })

  const tasks = matchers.reduce((tasks, matcher) => {
    tasks.push(...matcher.scripts)
    return tasks
  }, [])

  tasks.push(() => {
    res.send('finished')
  })
  
  runTasks(tasks, reqTime)()
})

app.listen(PORT, () => {
  console.log(`the server is on port ${PORT}`)
})
