const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Todo', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deadline'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('now'),
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('now'),
      field: 'updated_at'
    }
  }, {
    sequelize,
    tableName: 'todos',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "todos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
