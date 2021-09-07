const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');

const requireToken = async (req, res, next) => {
  const token = req.headers.authorization
  const userObject = await User.byToken(token)
  req.user = userObject
  next()
}

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/users/:userId/notes', requireToken, async (req, res, next) => {
  try{
    // const id = await User.byToken(req.headers.authorization)
    if(req.user.dataValues.id.toString() === req.params.userId){
      const note = (await Note.findAll(
        {where: {userId: req.params.userId}}
        ))
        res.send(note)
      } else {
        res.send([])
      }
    }
  catch(ex){
    next(ex)
  }
})

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
