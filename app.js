const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()

const databasePath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())

let database = null

const initlizationDbAndReverse = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`Db Error: ${error.message}`)
    process.exit(1)
  }
}

initlizationDbAndReverse()

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `
    SELECT
    *
    FROM
    todo

    WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}'
    AND status  = '${status}';`
      break

    case hasPriorityProperty(request.query):
      getTodoQuery = `
    SELECT
    *
    FROM 
    todo
    WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
    SELECT 
    *
    FROM
    todo
    
    WHERE 
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break

    default:
      getTodosQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%';`

      const data = await database.all(getTodosQuery)
      response.send(data)
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  const getTodosQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  id = ${todoId};`

  const getTodosArray = await database.get(getTodosQuery)
  response.send(getTodosArray)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const createTodosQuery = `
  INSERT INTO 
  todo (id, todo, priority, status)
  VALUES
  (${id}, '${todo}', '${priority}', '${status}');`

  await database.run(createTodosQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break;

    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break;

    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break;
  }

  const previousTodoQuery = `
  SELECT
  *
  FROM
  todo
  WHERE
  id = ${todoId};`

  const previousTodo = await database.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
  UPDATE 
  todo
  
  SET
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'

  WHERE 
  id = ${todoId};`

  await database.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
  todo
  WHERE
  id = ${todoId};`

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
