var DataTypes = require("sequelize").DataTypes;
var _todos = require("./Todo");
var _users = require("./User");

function initModels(sequelize) {
  var Todo = _todos(sequelize, DataTypes);
  var User = _users(sequelize, DataTypes);

  Todo.belongsTo(User, { foreignKey: "user_id"});
  User.hasMany(Todo, { foreignKey: "user_id"});

  return {
    Todo,
    User,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
