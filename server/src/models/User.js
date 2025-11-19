import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const User = sequelize.define(
  "User",
  {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "users",
  }
);

// Associations
export const associateUser = (models) => {
  User.hasMany(models.Address, { foreignKey: "userId", onDelete: "CASCADE" });
  User.hasMany(models.Order, { foreignKey: "userId", onDelete: "CASCADE" });
};
