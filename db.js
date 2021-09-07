const saltRounds = 10;
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

User.addHook('beforeCreate', async (user) => {
    const hash = await bcrypt.hash(user.password, saltRounds)
    user.password = hash;
})


User.byToken = async(token)=> {
  try {
    const {id} = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(id);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
    const user = await User.findOne({
     where: {
      username,
        }
    });
    if(user){
        const match = await bcrypt.compare(password, user.password);
        if(match){
            const token = jwt.sign({id: user.id}, process.env.JWT);
            return token; 
        }   
    }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};


const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};

/*

const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const user = await User.findByPk(token);
    if(user){
      return user;
    }
    const error = Error('bad credentials?');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials!');
    console.error(ex);
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {

    const user = await User.findOne({
     where: {
      username,
      password
        }
    });
    if(user){
        const token = jwt.sign({id: user.id}, "somekeyhere")
        console.log(token);
        return user.id; 
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};

*/