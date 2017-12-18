// Imports
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const uuidv4 = require('uuid/v4');

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

const TODOIST_ROOT_URL = 'https://todoist.com/api/v7/sync';
const TWIST_ROOT_URL = `https://api.twistapp.com/api/v2/threads`;

const TWIST_TOKEN = 'oauth2:0ae5517860755a0964b58c65bd821d322a98ba18'
const TODOIST_TOKEN = '2bbe8b025f85d830693594dfd2254fa30ada3cd4'

app.post('/twist', async (req, res) => {
  const twistItem = req.body;
  console.log(`Incoming Twist: ${JSON.stringify(twistItem)}`);

  try {
    const request = await addTodo(twistItem)
    res.sendStatus(200); 
  }
  catch (error) {
    console.error(error);
    res.sendStatus(400)
  } 
})

app.post('/todoist', async (req, res) => {
  console.log(`Incoming completed task from Todoist`)
  const completedTask = req.body;

  // ID and Title
  const content = completedTask.event_data.content;
  const thread_id = content.split(' ')[0];
  console.log(`thread_id retrieved from Task content: ${thread_id}`);


  if (thread_id) { 
    const title = await getOneThread(thread_id);
    console.log(`Thread ID: ${thread_id} Title: ${title}`);

    await updateThreadTitle(thread_id, title);

    res.sendStatus(200);
  }
})

// Listen
app.listen(process.env.PORT || 3000, () => console.log(`Server listening on port ${process.env.port || 3000}`))


const addTodo = async request => {
  return await axios.post(`${TODOIST_ROOT_URL}`, {
    token: TODOIST_TOKEN,
    commands: [
      {
        type: 'item_add',
        temp_id: uuidv4(),
        uuid: uuidv4(),
        args: {
          content: `${request.thread_id} ${request.thread_title}`
        }
      }
    ]
  })
}

const getOneThread = async thread_id => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${TWIST_TOKEN}` },
      params: { id: thread_id}
    }
    const result = await axios.get(`${TWIST_ROOT_URL}/getone`, config)

    return result.data.title
  }
  catch (e) {
    console.error(e.message);
  }
}

const updateThreadTitle = async (thread_id, thread_title) => {
  const config = { headers: { Authorization: `Bearer ${TWIST_TOKEN}` }}
  const params = { title: `✅ ${thread_title}`, id: thread_id };

  try {
    return axios.post(`${TWIST_ROOT_URL}/update`, params, config)
  }
  catch (e) {
    console.error(e.message)
  }
}